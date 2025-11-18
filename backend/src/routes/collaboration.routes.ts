import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '@middleware/auth';
import { validate } from '@middleware/validate';
import { CollaborationController } from '@controllers/CollaborationController';

const router = Router();

/**
 * Validation schemas
 */
const createSessionSchema = {
  body: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    labId: Joi.string().uuid().optional().allow(null),
    maxParticipants: Joi.number().min(2).max(50).optional().default(10),
  }),
};

/**
 * GET /api/collaboration/sessions
 * Get all collaboration sessions for the authenticated user
 */
router.get('/sessions', authenticate, CollaborationController.getSessions);

/**
 * GET /api/collaboration/sessions/active
 * Get all active collaboration sessions (public)
 */
router.get('/sessions/active', authenticate, CollaborationController.getActiveSessions);

/**
 * GET /api/collaboration/sessions/:sessionId
 * Get a specific collaboration session
 */
router.get('/sessions/:sessionId', authenticate, CollaborationController.getSession);

/**
 * POST /api/collaboration/create
 * Create a new collaboration session
 */
router.post(
  '/create',
  authenticate,
  validate(createSessionSchema),
  CollaborationController.createSession
);

/**
 * POST /api/collaboration/:sessionId/join
 * Join an existing collaboration session
 */
router.post('/:sessionId/join', authenticate, CollaborationController.joinSession);

/**
 * POST /api/collaboration/:sessionId/leave
 * Leave a collaboration session
 */
router.post('/:sessionId/leave', authenticate, CollaborationController.leaveSession);

/**
 * DELETE /api/collaboration/:sessionId
 * End/delete a collaboration session (host only)
 */
router.delete('/:sessionId', authenticate, CollaborationController.endSession);

export default router;
