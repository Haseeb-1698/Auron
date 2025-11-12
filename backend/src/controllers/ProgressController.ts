import { Response } from 'express';
import { AuthRequest } from '@controllers/AuthController';
import ProgressService, { UpdateProgressData } from '@services/ProgressService';
import { logger } from '@utils/logger';

export class ProgressController {
  /**
   * Get user's progress for all labs
   */
  static async getUserProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const progress = await ProgressService.getUserProgress(userId);

      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error: any) {
      logger.error('Get user progress error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get progress',
      });
    }
  }

  /**
   * Get user's progress for a specific lab
   */
  static async getLabProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { labId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const progress = await ProgressService.getUserLabProgress(userId, labId);

      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error: any) {
      logger.error('Get lab progress error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get lab progress',
      });
    }
  }

  /**
   * Update progress
   */
  static async updateProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { labId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const updateData: UpdateProgressData = {
        userId,
        labId,
        ...req.body,
      };

      const progress = await ProgressService.updateProgress(updateData);

      res.status(200).json({
        success: true,
        message: 'Progress updated successfully',
        data: progress,
      });
    } catch (error: any) {
      logger.error('Update progress error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update progress',
      });
    }
  }

  /**
   * Complete an exercise
   */
  static async completeExercise(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { labId, exerciseId } = req.params;
      const { pointsEarned } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const progress = await ProgressService.completeExercise(
        userId,
        labId,
        exerciseId,
        pointsEarned
      );

      res.status(200).json({
        success: true,
        message: 'Exercise completed successfully',
        data: progress,
      });
    } catch (error: any) {
      logger.error('Complete exercise error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete exercise',
      });
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const stats = await ProgressService.getUserStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user stats',
      });
    }
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const leaderboard = await ProgressService.getLeaderboard(limit);

      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (error: any) {
      logger.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get leaderboard',
      });
    }
  }

  /**
   * Reset progress for a lab
   */
  static async resetProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { labId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const progress = await ProgressService.resetProgress(userId, labId);

      res.status(200).json({
        success: true,
        message: 'Progress reset successfully',
        data: progress,
      });
    } catch (error: any) {
      logger.error('Reset progress error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reset progress',
      });
    }
  }
}

export default ProgressController;
