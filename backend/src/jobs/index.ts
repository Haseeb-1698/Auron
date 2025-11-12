import CleanupJob from './CleanupJob';
import MonitoringJob from './MonitoringJob';
import { logger } from '@utils/logger';

/**
 * Job Manager
 * Centralized management of all background jobs
 */

export class JobManager {
  /**
   * Start all jobs
   */
  static startAll(): void {
    logger.info('Starting all background jobs');

    try {
      CleanupJob.start();
      MonitoringJob.start();

      logger.info('All background jobs started successfully');
    } catch (error) {
      logger.error('Failed to start background jobs:', error);
      throw error;
    }
  }

  /**
   * Stop all jobs
   */
  static stopAll(): void {
    logger.info('Stopping all background jobs');

    try {
      CleanupJob.stop();
      MonitoringJob.stop();

      logger.info('All background jobs stopped successfully');
    } catch (error) {
      logger.error('Failed to stop background jobs:', error);
    }
  }

  /**
   * Get job status
   */
  static getStatus(): {
    cleanup: { running: boolean };
    monitoring: { running: boolean };
  } {
    return {
      cleanup: { running: true }, // Will be enhanced with actual status checks
      monitoring: { running: true },
    };
  }
}

export { CleanupJob, MonitoringJob };
export default JobManager;
