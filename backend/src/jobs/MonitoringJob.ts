import cron from 'node-cron';
import LabInstanceRepository from '@repositories/LabInstanceRepository';
import VultrService from '@services/VultrService';
import { LabInstanceStatus } from '@models/LabInstance';
import { logger } from '@utils/logger';
import redis from '@config/redis';

/**
 * Monitoring Job
 * Monitors health of running lab instances
 * Syncs VM status with Vultr API
 * Checks for resource usage and alerts
 */

export class MonitoringJob {
  private static readonly MONITORING_CRON = '*/10 * * * *'; // Every 10 minutes
  private static isRunning = false;
  private static task: cron.ScheduledTask | null = null;

  /**
   * Start the monitoring job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Monitoring job is already running');
      return;
    }

    logger.info('Starting monitoring job', { schedule: this.MONITORING_CRON });

    this.task = cron.schedule(this.MONITORING_CRON, async () => {
      await this.runMonitoring();
    });

    // Run immediately on startup
    this.runMonitoring();
  }

  /**
   * Stop the monitoring job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Monitoring job stopped');
    }
  }

  /**
   * Run the monitoring process
   */
  private static async runMonitoring(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Monitoring job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Running monitoring job');

      // Get all running instances
      const runningInstances = await LabInstanceRepository.findAll({
        status: LabInstanceStatus.RUNNING,
      });

      let syncedCount = 0;
      let errorCount = 0;

      for (const instance of runningInstances) {
        try {
          // Sync status with Vultr
          await this.syncInstanceStatus(instance);
          syncedCount++;
        } catch (error) {
          logger.error(`Failed to sync instance ${instance.id}:`, error);
          errorCount++;
        }
      }

      // Store monitoring metrics
      await this.storeMetrics({
        timestamp: new Date(),
        totalRunning: runningInstances.length,
        synced: syncedCount,
        errors: errorCount,
      });

      const duration = Date.now() - startTime;
      logger.info('Monitoring job completed', {
        totalInstances: runningInstances.length,
        synced: syncedCount,
        errors: errorCount,
        durationMs: duration,
      });
    } catch (error) {
      logger.error('Monitoring job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync instance status with Vultr API
   */
  private static async syncInstanceStatus(instance: any): Promise<void> {
    try {
      const vultrInstance = await VultrService.getInstance(instance.cloudInstanceId);

      // Map Vultr status to our status
      let status = instance.status;
      let shouldUpdate = false;

      if (vultrInstance.powerStatus === 'running') {
        if (instance.status !== LabInstanceStatus.RUNNING) {
          status = LabInstanceStatus.RUNNING;
          shouldUpdate = true;
        }
      } else if (vultrInstance.powerStatus === 'stopped') {
        if (instance.status !== LabInstanceStatus.STOPPED) {
          status = LabInstanceStatus.STOPPED;
          shouldUpdate = true;
        }
      }

      // Update if status changed
      if (shouldUpdate) {
        await instance.update({ status });
        logger.info(`Updated instance ${instance.id} status to ${status}`);
      }

      // Check if instance is expired but still running
      if (instance.isExpired() && instance.isRunning()) {
        logger.warn(`Instance ${instance.id} is expired but still running`, {
          expiresAt: instance.expiresAt,
          userId: instance.userId,
        });
      }
    } catch (error) {
      if ((error as any).response?.status === 404) {
        // VM doesn't exist in Vultr anymore
        logger.warn(`VM not found in Vultr for instance ${instance.id}, marking as error`);
        await instance.update({
          status: LabInstanceStatus.ERROR,
          errorMessage: 'VM not found in cloud provider',
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Store monitoring metrics in Redis
   */
  private static async storeMetrics(metrics: any): Promise<void> {
    try {
      const key = `monitoring:metrics:${Date.now()}`;
      await redis.setex(key, 86400, JSON.stringify(metrics)); // Keep for 24 hours

      // Also update latest metrics
      await redis.set('monitoring:latest', JSON.stringify(metrics));
    } catch (error) {
      logger.warn('Failed to store monitoring metrics:', error);
    }
  }

  /**
   * Get latest monitoring metrics
   */
  static async getLatestMetrics(): Promise<any> {
    try {
      const data = await redis.get('monitoring:latest');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get monitoring metrics:', error);
      return null;
    }
  }

  /**
   * Manual trigger for monitoring (useful for testing)
   */
  static async trigger(): Promise<void> {
    logger.info('Manually triggered monitoring job');
    await this.runMonitoring();
  }
}

export default MonitoringJob;
