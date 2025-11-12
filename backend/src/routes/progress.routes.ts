import { Router } from 'express';
import ProgressController from '@controllers/ProgressController';
import { authMiddleware } from '@middleware/auth';
import { validateRequest } from '@middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const updateProgressSchema = Joi.object({
  status: Joi.string().valid('not_started', 'in_progress', 'completed').optional(),
  progressPercentage: Joi.number().min(0).max(100).optional(),
  completedExercises: Joi.array().items(Joi.string()).optional(),
  hintsUsed: Joi.number().min(0).optional(),
  timeSpent: Joi.number().min(0).optional(),
  pointsEarned: Joi.number().min(0).optional(),
  score: Joi.number().min(0).max(100).optional(),
  notes: Joi.string().allow('', null).optional(),
  flaggedVulnerabilities: Joi.array().optional(),
});

const completeExerciseSchema = Joi.object({
  pointsEarned: Joi.number().min(0).default(0),
});

// All routes require authentication
router.use(authMiddleware);

// Get user's progress for all labs
router.get('/', ProgressController.getUserProgress);

// Get leaderboard
router.get('/leaderboard', ProgressController.getLeaderboard);

// Get user statistics
router.get('/stats', ProgressController.getUserStats);

// Get progress for a specific lab
router.get('/lab/:labId', ProgressController.getLabProgress);

// Update progress for a lab
router.put('/lab/:labId', validateRequest(updateProgressSchema), ProgressController.updateProgress);

// Complete an exercise
router.post(
  '/lab/:labId/exercise/:exerciseId/complete',
  validateRequest(completeExerciseSchema),
  ProgressController.completeExercise
);

// Reset progress for a lab
router.post('/lab/:labId/reset', ProgressController.resetProgress);

export default router;
