import { Router } from 'express';
import { ReportController } from '@controllers/ReportController';
import { authMiddleware } from '@middleware/auth';
import { validate } from '@middleware/validation';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Validation Schemas
 */
const generateReportSchema = {
  body: Joi.object({
    reportType: Joi.string()
      .valid('lab_completion', 'vulnerability_scan', 'progress_summary', 'custom')
      .required(),
    format: Joi.string().valid('pdf', 'json', 'csv', 'html').default('pdf'),
    labId: Joi.string().uuid().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    title: Joi.string().max(255).optional(),
    description: Joi.string().max(1000).optional(),
  }),
};

const getReportByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const getUserReportsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    reportType: Joi.string()
      .valid('lab_completion', 'vulnerability_scan', 'progress_summary', 'custom')
      .optional(),
    status: Joi.string().valid('pending', 'generating', 'completed', 'failed').optional(),
  }),
};

/**
 * Routes
 */

// Generate new report
router.post('/', validate(generateReportSchema), ReportController.generateReport);

// Get user's reports
router.get('/user', validate(getUserReportsSchema), ReportController.getUserReports);

// Get report statistics
router.get('/stats', ReportController.getReportStats);

// Get specific report
router.get('/:id', validate(getReportByIdSchema), ReportController.getReport);

// Download report file
router.get('/:id/download', validate(getReportByIdSchema), ReportController.downloadReport);

// Delete report
router.delete('/:id', validate(getReportByIdSchema), ReportController.deleteReport);

export default router;
