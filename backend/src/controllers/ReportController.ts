import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { ReportService } from '@services/ReportService';
import { Report, ReportType, ReportFormat } from '@models/Report';
import { logger } from '@utils/logger';
import fs from 'fs';

/**
 * ReportController
 * Handles report generation and retrieval endpoints
 */
export class ReportController {
  /**
   * Generate a new report
   * POST /api/reports
   */
  static async generateReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { reportType, format, labId, startDate, endDate, title, description } = req.body;

      const report = await ReportService.generateReport(
        userId,
        reportType as ReportType,
        format as ReportFormat,
        {
          labId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          title,
          description,
        }
      );

      res.status(201).json({
        success: true,
        message: 'Report generation started',
        data: report,
      });
    } catch (error) {
      logger.error('Failed to generate report:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate report',
      });
    }
  }

  /**
   * Get report by ID
   * GET /api/reports/:id
   */
  static async getReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const report = await Report.findByPk(id);

      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      // Verify ownership
      if (report.userId !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Failed to get report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve report',
      });
    }
  }

  /**
   * Get user's reports
   * GET /api/reports/user
   */
  static async getUserReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { page = 1, limit = 20, reportType, status } = req.query;

      const whereClause: {
        userId: string;
        reportType?: ReportType;
        status?: string;
      } = { userId };

      if (reportType) {
        whereClause.reportType = reportType as ReportType;
      }
      if (status) {
        whereClause.status = status as string;
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { rows: reports, count: total } = await Report.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset,
      });

      res.json({
        success: true,
        data: reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Failed to get user reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve reports',
      });
    }
  }

  /**
   * Download report file
   * GET /api/reports/:id/download
   */
  static async downloadReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const report = await Report.findByPk(id);

      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      // Verify ownership
      if (report.userId !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Check if report is completed
      if (report.status !== 'completed') {
        res.status(400).json({
          success: false,
          message: `Report is not ready. Current status: ${report.status}`,
        });
        return;
      }

      // Check if file exists
      if (!report.filePath || !fs.existsSync(report.filePath)) {
        res.status(404).json({ success: false, message: 'Report file not found' });
        return;
      }

      // Get content type based on format
      const contentTypes: Record<string, string> = {
        pdf: 'application/pdf',
        json: 'application/json',
        csv: 'text/csv',
        html: 'text/html',
      };

      const contentType = contentTypes[report.format] || 'application/octet-stream';

      // Send file
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
      res.setHeader('Content-Length', report.fileSize || 0);

      const fileStream = fs.createReadStream(report.filePath);
      fileStream.pipe(res);
    } catch (error) {
      logger.error('Failed to download report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download report',
      });
    }
  }

  /**
   * Delete report
   * DELETE /api/reports/:id
   */
  static async deleteReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const report = await Report.findByPk(id);

      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      // Verify ownership
      if (report.userId !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      // Delete file if exists
      if (report.filePath && fs.existsSync(report.filePath)) {
        fs.unlinkSync(report.filePath);
      }

      await report.destroy();

      res.json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete report',
      });
    }
  }

  /**
   * Get report statistics
   * GET /api/reports/stats
   */
  static async getReportStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const totalReports = await Report.count({ where: { userId } });
      const completedReports = await Report.count({
        where: { userId, status: 'completed' },
      });
      const pendingReports = await Report.count({
        where: { userId, status: 'pending' },
      });
      const failedReports = await Report.count({
        where: { userId, status: 'failed' },
      });

      const recentReports = await Report.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 5,
      });

      res.json({
        success: true,
        data: {
          total: totalReports,
          completed: completedReports,
          pending: pendingReports,
          failed: failedReports,
          recent: recentReports,
        },
      });
    } catch (error) {
      logger.error('Failed to get report stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve report statistics',
      });
    }
  }

  /**
   * Save browser extension security finding
   * POST /api/reports/extension-finding
   */
  static async saveExtensionFinding(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { url, finding_type, details, risk_level } = req.body;

      // Save to database using raw query for now until we create the model
      const { db } = await import('@config/database');

      const [result] = await db.query(
        `INSERT INTO extension_findings (id, user_id, url, finding_type, details, risk_level, created_at)
         VALUES (gen_random_uuid(), :userId, :url, :findingType, :details, :riskLevel, NOW())
         RETURNING *`,
        {
          replacements: {
            userId,
            url,
            findingType: finding_type,
            details: JSON.stringify(details),
            riskLevel: risk_level,
          },
          type: db.QueryTypes.SELECT,
        }
      );

      logger.info(`Extension finding saved for user ${userId}: ${finding_type} on ${url}`);

      res.status(201).json({
        success: true,
        message: 'Finding saved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to save extension finding:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save finding',
      });
    }
  }

  /**
   * Get user's browser extension findings
   * GET /api/reports/extension-findings
   */
  static async getExtensionFindings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { db } = await import('@config/database');

      const findings = await db.query(
        `SELECT * FROM extension_findings
         WHERE user_id = :userId
         ORDER BY created_at DESC
         LIMIT 100`,
        {
          replacements: { userId },
          type: db.QueryTypes.SELECT,
        }
      );

      res.json({
        success: true,
        data: findings,
      });
    } catch (error) {
      logger.error('Failed to get extension findings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve extension findings',
      });
    }
  }
}
