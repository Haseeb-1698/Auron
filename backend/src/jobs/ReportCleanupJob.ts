import cron from 'node-cron';
import { ReportService } from '@services/ReportService';
import { logger } from '@utils/logger';

/**
 * Report Cleanup Job
 * Automatically cleanup expired reports
 * Runs daily at 2 AM to delete expired report files
 */

export class ReportCleanupJob {
  private static readonly CLEANUP_CRON = '0 2 * * *'; // Daily at 2 AM
  private static isRunning = false;
  private static task: cron.ScheduledTask | null = null;

  /**
   * Start the report cleanup job
   */
  static start(): void {
    if (this.task) {
      logger.warn('Report cleanup job is already running');
      return;
    }

    logger.info('Starting report cleanup job', { schedule: this.CLEANUP_CRON });

    this.task = cron.schedule(this.CLEANUP_CRON, async () => {
      await this.runCleanup();
    });

    // Run once on startup if needed
    // this.runCleanup();
  }

  /**
   * Stop the report cleanup job
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Report cleanup job stopped');
    }
  }

  /**
   * Run the cleanup process
   */
  private static async runCleanup(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Report cleanup job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Running report cleanup job');

      const cleanedCount = await ReportService.cleanupExpiredReports();

      const duration = Date.now() - startTime;
      logger.info('Report cleanup job completed', {
        cleanedCount,
        durationMs: duration,
      });
    } catch (error) {
      logger.error('Report cleanup job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual trigger for cleanup (useful for testing)
   */
  static async trigger(): Promise<number> {
    logger.info('Manually triggered report cleanup job');
    return await ReportService.cleanupExpiredReports();
  }
}

export default ReportCleanupJob;
