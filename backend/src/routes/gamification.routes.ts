import { Router } from 'express';
import GamificationController from '@controllers/GamificationController';
import { authMiddleware } from '@middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's earned badges
router.get('/badges', GamificationController.getUserBadges);

// Get all badges with progress
router.get('/badges/all', GamificationController.getAllBadges);

// Manually check for new badges
router.post('/badges/check', GamificationController.checkBadges);

export default router;
