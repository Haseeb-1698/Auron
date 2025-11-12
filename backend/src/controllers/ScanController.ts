import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { VulnerabilityScanService } from '@services/VulnerabilityScanService';
import { ScanType } from '@models/Scan';
import { logger } from '@utils/logger';

/**
 * ScanController
 * Handles vulnerability scanning endpoints
 */
export class ScanController {
  /**
   * Start a new vulnerability scan
   * POST /api/scans
   */
  static async startScan(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { labId, instanceId, scanType } = req.body;
      const userId = req.user!.userId;

      const scan = await VulnerabilityScanService.startScan(
        userId,
        labId,
        instanceId,
        scanType || ScanType.QUICK
      );

      res.status(201).json({
        success: true,
        message: 'Scan started successfully',
        data: scan,
      });
    } catch (error) {
      logger.error('Failed to start scan:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start scan',
      });
    }
  }

  /**
   * Get scan details by ID
   * GET /api/scans/:id
   */
  static async getScan(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const scan = await VulnerabilityScanService.getScanById(id);
      if (!scan) {
        res.status(404).json({
          success: false,
          message: 'Scan not found',
        });
        return;
      }

      // Verify user owns this scan or is admin
      if (scan.userId !== req.user!.userId && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      res.json({
        success: true,
        data: scan,
      });
    } catch (error) {
      logger.error('Failed to get scan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve scan',
      });
    }
  }

  /**
   * Get user's scans
   * GET /api/scans/user
   */
  static async getUserScans(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const scans = await VulnerabilityScanService.getUserScans(userId, limit);

      res.json({
        success: true,
        data: scans,
        count: scans.length,
      });
    } catch (error) {
      logger.error('Failed to get user scans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve scans',
      });
    }
  }

  /**
   * Get scans for a specific lab
   * GET /api/scans/lab/:labId
   */
  static async getLabScans(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { labId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const scans = await VulnerabilityScanService.getLabScans(labId, limit);

      // Filter to only show user's scans unless admin
      const filteredScans =
        req.user!.role === 'admin'
          ? scans
          : scans.filter((scan) => scan.userId === req.user!.userId);

      res.json({
        success: true,
        data: filteredScans,
        count: filteredScans.length,
      });
    } catch (error) {
      logger.error('Failed to get lab scans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve scans',
      });
    }
  }

  /**
   * Cancel a running scan
   * POST /api/scans/:id/cancel
   */
  static async cancelScan(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verify ownership
      const scan = await VulnerabilityScanService.getScanById(id);
      if (!scan) {
        res.status(404).json({
          success: false,
          message: 'Scan not found',
        });
        return;
      }

      if (scan.userId !== req.user!.userId && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      const cancelledScan = await VulnerabilityScanService.cancelScan(id);

      res.json({
        success: true,
        message: 'Scan cancelled successfully',
        data: cancelledScan,
      });
    } catch (error) {
      logger.error('Failed to cancel scan:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel scan',
      });
    }
  }

  /**
   * Get scan statistics
   * GET /api/scans/stats
   */
  static async getScanStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const scans = await VulnerabilityScanService.getUserScans(userId, 100);

      const stats = {
        totalScans: scans.length,
        completedScans: scans.filter((s) => s.status === 'completed').length,
        failedScans: scans.filter((s) => s.status === 'failed').length,
        runningScans: scans.filter((s) => s.status === 'running').length,
        totalVulnerabilities: scans.reduce(
          (sum, s) => sum + (s.results?.summary.total || 0),
          0
        ),
        criticalVulnerabilities: scans.reduce(
          (sum, s) => sum + (s.results?.summary.critical || 0),
          0
        ),
        highVulnerabilities: scans.reduce(
          (sum, s) => sum + (s.results?.summary.high || 0),
          0
        ),
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get scan stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve scan statistics',
      });
    }
  }
}

export default ScanController;
