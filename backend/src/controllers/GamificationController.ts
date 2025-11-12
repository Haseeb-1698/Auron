import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import GamificationService from '@services/GamificationService';
import { logger } from '@utils/logger';

export class GamificationController {
  /**
   * Get user's badges
   * GET /api/gamification/badges
   */
  async getUserBadges(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;

      const badges = await GamificationService.getUserBadges(userId);

      res.status(200).json({
        success: true,
        data: badges,
      });
    } catch (error: any) {
      logger.error('Get user badges error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get badges',
      });
    }
  }

  /**
   * Get all badges with progress
   * GET /api/gamification/badges/all
   */
  async getAllBadges(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;

      const badges = await GamificationService.getAllBadgesWithProgress(userId);

      res.status(200).json({
        success: true,
        data: badges,
      });
    } catch (error: any) {
      logger.error('Get all badges error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get all badges',
      });
    }
  }

  /**
   * Check for new badges (manually trigger)
   * POST /api/gamification/badges/check
   */
  async checkBadges(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;

      const newBadges = await GamificationService.checkAndAwardBadges(userId);

      res.status(200).json({
        success: true,
        data: {
          newBadges,
          count: newBadges.length,
        },
        message: newBadges.length > 0
          ? `Congratulations! You earned ${newBadges.length} new badge(s)!`
          : 'No new badges earned',
      });
    } catch (error: any) {
      logger.error('Check badges error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check badges',
      });
    }
  }
}

export default new GamificationController();
