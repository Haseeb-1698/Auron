import { Router } from 'express';
import { ScanController } from '@controllers/ScanController';
import { authMiddleware } from '@middleware/auth';
import { validate } from '@middleware/validation';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Validation Schemas
 */
const startScanSchema = {
  body: Joi.object({
    labId: Joi.string().uuid().required(),
    instanceId: Joi.string().uuid().required(),
    scanType: Joi.string().valid('quick', 'full', 'custom').optional(),
  }),
};

const getScanByIdSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const getLabScansSchema = {
  params: Joi.object({
    labId: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
};

/**
 * Routes
 */

// POST /api/scans - Start a new scan
router.post('/', validate(startScanSchema), ScanController.startScan);

// GET /api/scans/user - Get current user's scans
router.get('/user', ScanController.getUserScans);

// GET /api/scans/stats - Get scan statistics
router.get('/stats', ScanController.getScanStats);

// GET /api/scans/lab/:labId - Get scans for a specific lab
router.get('/lab/:labId', validate(getLabScansSchema), ScanController.getLabScans);

// GET /api/scans/:id - Get scan details
router.get('/:id', validate(getScanByIdSchema), ScanController.getScan);

// POST /api/scans/:id/cancel - Cancel a running scan
router.post('/:id/cancel', validate(getScanByIdSchema), ScanController.cancelScan);

export default router;
