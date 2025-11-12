import cron from 'node-cron';
import CloudLabService from '@services/CloudLabService';
import { logger } from '@utils/logger';

/**
 * Cleanup Job
 * Automatically cleanup expired lab instances
 * Runs every 5 minutes to check for expired VMs
 */

export class CleanupJob {
  private static readonly CLEANUP_CRON = '*/5 * * * *'; // Every 5 minutes
  private static isRunning = false;
  private static task: cron.ScheduledTask | null = null;

  /**
   * Start the cleanup job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Cleanup job is already running');
      return;
    }

    logger.info('Starting cleanup job', { schedule: this.CLEANUP_CRON });

    this.task = cron.schedule(this.CLEANUP_CRON, async () => {
      await this.runCleanup();
    });

    // Run immediately on startup
    this.runCleanup();
  }

  /**
   * Stop the cleanup job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Cleanup job stopped');
    }
  }

  /**
   * Run the cleanup process
   */
  private static async runCleanup(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Cleanup job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Running cleanup job');

      const cleanedCount = await CloudLabService.cleanupExpiredInstances();

      const duration = Date.now() - startTime;
      logger.info('Cleanup job completed', {
        cleanedCount,
        durationMs: duration,
      });
    } catch (error) {
      logger.error('Cleanup job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual trigger for cleanup (useful for testing)
   */
  static async trigger(): Promise<number> {
    logger.info('Manually triggered cleanup job');
    return await CloudLabService.cleanupExpiredInstances();
  }
}

export default CleanupJob;
