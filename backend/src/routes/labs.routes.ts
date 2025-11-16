import { Router } from 'express';
import LabController from '@controllers/LabController';
import { authenticate, optionalAuth } from '@middleware/auth';
import { validate, schemas } from '@middleware/validation';
import { asyncHandler } from '@middleware/errorHandler';
import Joi from 'joi';

/**
 * Lab Routes
 * Defines API endpoints for lab environment management
 */

const router = Router();

// Validation schemas
const startLabSchema = {
  params: Joi.object({
    id: schemas.uuid.required(),
  }),
  body: Joi.object({
    timeoutOverride: Joi.number().integer().min(60000).max(14400000).optional(),
    deploymentMode: Joi.string().valid('docker', 'cloud').optional(),
  }),
};

const instanceIdSchema = {
  params: Joi.object({
    instanceId: schemas.uuid.required(),
  }),
};

const labIdSchema = {
  params: Joi.object({
    id: schemas.uuid.required(),
  }),
};

// Routes

/**
 * GET /api/labs
 * Get all available labs (with optional filters)
 * Query params: category, difficulty, search
 */
router.get(
  '/',
  optionalAuth,
  asyncHandler(LabController.getAllLabs.bind(LabController))
);

/**
 * GET /api/labs/:id
 * Get lab details by ID
 */
router.get(
  '/:id',
  validate(labIdSchema),
  optionalAuth,
  asyncHandler(LabController.getLabById.bind(LabController))
);

/**
 * POST /api/labs/:id/start
 * Start a new lab instance
 * Requires authentication
 */
router.post(
  '/:id/start',
  authenticate,
  validate(startLabSchema),
  asyncHandler(LabController.startLab.bind(LabController))
);

/**
 * GET /api/labs/instances
 * Get user's lab instances
 * Requires authentication
 */
router.get(
  '/instances/list',
  authenticate,
  asyncHandler(LabController.getUserInstances.bind(LabController))
);

/**
 * GET /api/labs/instances/:instanceId
 * Get lab instance details
 * Requires authentication
 */
router.get(
  '/instances/:instanceId',
  authenticate,
  validate(instanceIdSchema),
  asyncHandler(LabController.getInstanceDetails.bind(LabController))
);

/**
 * POST /api/labs/instances/:instanceId/stop
 * Stop a running lab instance
 * Requires authentication
 */
router.post(
  '/instances/:instanceId/stop',
  authenticate,
  validate(instanceIdSchema),
  asyncHandler(LabController.stopLab.bind(LabController))
);

/**
 * POST /api/labs/instances/:instanceId/restart
 * Restart a lab instance
 * Requires authentication
 */
router.post(
  '/instances/:instanceId/restart',
  authenticate,
  validate(instanceIdSchema),
  asyncHandler(LabController.restartLab.bind(LabController))
);

/**
 * POST /api/labs/instances/:instanceId/reset
 * Reset a lab instance (removes and creates new)
 * Requires authentication
 */
router.post(
  '/instances/:instanceId/reset',
  authenticate,
  validate(instanceIdSchema),
  asyncHandler(LabController.resetLab.bind(LabController))
);

export default router;
