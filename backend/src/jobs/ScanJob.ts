import cron from 'node-cron';
import { Scan } from '@models/Scan';
import { VulnerabilityScanService } from '@services/VulnerabilityScanService';
import { logger } from '@utils/logger';
import { Op } from 'sequelize';

/**
 * Scan Job
 * Automatically processes pending vulnerability scans
 * Runs every minute to check for pending scans and execute them
 */

export class ScanJob {
  private static readonly SCAN_CRON = '*/1 * * * *'; // Every minute
  private static isRunning = false;
  private static task: cron.ScheduledTask | null = null;
  private static readonly MAX_CONCURRENT_SCANS = 3; // Limit concurrent scans

  /**
   * Start the scan job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Scan job is already running');
      return;
    }

    logger.info('Starting scan job', { schedule: this.SCAN_CRON });

    this.task = cron.schedule(this.SCAN_CRON, async () => {
      await this.runScanProcessor();
    });

    // Run immediately on startup
    this.runScanProcessor();
  }

  /**
   * Stop the scan job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Scan job stopped');
    }
  }

  /**
   * Run the scan processor
   */
  private static async runScanProcessor(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Scan job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.debug('Running scan processor');

      // Check for stuck scans (running for more than 30 minutes)
      await this.handleStuckScans();

      // Get count of currently running scans
      const runningCount = await Scan.count({
        where: { status: 'running' },
      });

      if (runningCount >= this.MAX_CONCURRENT_SCANS) {
        logger.debug('Maximum concurrent scans reached', {
          running: runningCount,
          max: this.MAX_CONCURRENT_SCANS,
        });
        return;
      }

      // Get pending scans
      const availableSlots = this.MAX_CONCURRENT_SCANS - runningCount;
      const pendingScans = await Scan.findAll({
        where: { status: 'pending' },
        order: [['createdAt', 'ASC']],
        limit: availableSlots,
      });

      if (pendingScans.length === 0) {
        logger.debug('No pending scans to process');
        return;
      }

      logger.info('Processing pending scans', {
        count: pendingScans.length,
        availableSlots,
      });

      // Process each pending scan
      const processPromises = pendingScans.map(async (scan) => {
        try {
          logger.info('Starting scan execution', { scanId: scan.id });

          // Execute scan in background (don't await)
          VulnerabilityScanService.executeScan(scan.id).catch((error) => {
            logger.error('Scan execution failed', {
              scanId: scan.id,
              error: error instanceof Error ? error.message : String(error),
            });
          });
        } catch (error) {
          logger.error('Failed to start scan', {
            scanId: scan.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      await Promise.all(processPromises);

      const duration = Date.now() - startTime;
      logger.info('Scan processor completed', {
        processed: pendingScans.length,
        durationMs: duration,
      });
    } catch (error) {
      logger.error('Scan processor failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Handle scans that are stuck in running state
   */
  private static async handleStuckScans(): Promise<void> {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const stuckScans = await Scan.findAll({
        where: {
          status: 'running',
          startedAt: {
            [Op.lt]: thirtyMinutesAgo,
          },
        },
      });

      if (stuckScans.length > 0) {
        logger.warn('Found stuck scans', { count: stuckScans.length });

        for (const scan of stuckScans) {
          await scan.update({
            status: 'failed',
            completedAt: new Date(),
            errorMessage: 'Scan timed out after 30 minutes',
          });

          logger.info('Marked stuck scan as failed', { scanId: scan.id });
        }
      }
    } catch (error) {
      logger.error('Failed to handle stuck scans:', error);
    }
  }

  /**
   * Manual trigger for scan processor (useful for testing)
   */
  static async trigger(): Promise<void> {
    logger.info('Manually triggered scan processor');
    await this.runScanProcessor();
  }

  /**
   * Get current scan queue status
   */
  static async getQueueStatus(): Promise<{
    pending: number;
    running: number;
    availableSlots: number;
  }> {
    const pending = await Scan.count({ where: { status: 'pending' } });
    const running = await Scan.count({ where: { status: 'running' } });

    return {
      pending,
      running,
      availableSlots: Math.max(0, this.MAX_CONCURRENT_SCANS - running),
    };
  }
}

export default ScanJob;
