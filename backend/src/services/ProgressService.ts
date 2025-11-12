import { UserProgress } from '@models/UserProgress';
import { Lab } from '@models/Lab';
import { User } from '@models/User';
import { logger } from '@utils/logger';

export interface UpdateProgressData {
  userId: string;
  labId: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  progressPercentage?: number;
  completedExercises?: string[];
  hintsUsed?: number;
  timeSpent?: number;
  pointsEarned?: number;
  score?: number;
  notes?: string;
  flaggedVulnerabilities?: any[];
}

export class ProgressService {
  /**
   * Get or create user progress for a lab
   */
  static async getOrCreateProgress(userId: string, labId: string): Promise<UserProgress> {
    try {
      let progress = await UserProgress.findOne({
        where: { userId, labId },
        include: [
          { model: Lab, as: 'lab' },
          { model: User, as: 'user' },
        ],
      });

      if (!progress) {
        progress = await UserProgress.create({
          userId,
          labId,
          status: 'not_started',
          progressPercentage: 0,
          completedExercises: [],
          hintsUsed: 0,
          attempts: 0,
          timeSpent: 0,
          pointsEarned: 0,
          score: 0,
          flaggedVulnerabilities: [],
        });

        logger.info(`Created progress record for user ${userId} on lab ${labId}`);
      }

      return progress;
    } catch (error) {
      logger.error('Get or create progress error:', error);
      throw error;
    }
  }

  /**
   * Update user progress
   */
  static async updateProgress(data: UpdateProgressData): Promise<UserProgress> {
    try {
      const progress = await this.getOrCreateProgress(data.userId, data.labId);

      const updateData: any = {};

      if (data.status !== undefined) {
        updateData.status = data.status;

        // Update timestamps based on status
        if (data.status === 'in_progress' && !progress.startedAt) {
          updateData.startedAt = new Date();
        } else if (data.status === 'completed' && !progress.completedAt) {
          updateData.completedAt = new Date();
        }
      }

      if (data.progressPercentage !== undefined) {
        updateData.progressPercentage = Math.min(100, Math.max(0, data.progressPercentage));
      }

      if (data.completedExercises !== undefined) {
        updateData.completedExercises = data.completedExercises;
      }

      if (data.hintsUsed !== undefined) {
        updateData.hintsUsed = data.hintsUsed;
      }

      if (data.timeSpent !== undefined) {
        updateData.timeSpent = data.timeSpent;
      }

      if (data.pointsEarned !== undefined) {
        updateData.pointsEarned = data.pointsEarned;
      }

      if (data.score !== undefined) {
        updateData.score = Math.min(100, Math.max(0, data.score));
      }

      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      if (data.flaggedVulnerabilities !== undefined) {
        updateData.flaggedVulnerabilities = data.flaggedVulnerabilities;
      }

      updateData.lastAccessedAt = new Date();
      updateData.attempts = progress.attempts + 1;

      await progress.update(updateData);

      logger.info(`Updated progress for user ${data.userId} on lab ${data.labId}`);
      return progress;
    } catch (error) {
      logger.error('Update progress error:', error);
      throw error;
    }
  }

  /**
   * Mark exercise as completed
   */
  static async completeExercise(
    userId: string,
    labId: string,
    exerciseId: string,
    pointsEarned: number = 0
  ): Promise<UserProgress> {
    try {
      const progress = await this.getOrCreateProgress(userId, labId);
      const lab = await Lab.findByPk(labId);

      if (!lab) {
        throw new Error('Lab not found');
      }

      // Add exercise to completed list if not already there
      const completedExercises = [...progress.completedExercises];
      if (!completedExercises.includes(exerciseId)) {
        completedExercises.push(exerciseId);
      }

      // Calculate progress percentage
      const totalExercises = (lab.exercises as any[]).length;
      const progressPercentage = Math.round((completedExercises.length / totalExercises) * 100);

      // Update points
      const totalPoints = progress.pointsEarned + pointsEarned;

      // Determine status
      let status = progress.status;
      if (progressPercentage === 100) {
        status = 'completed';
      } else if (progressPercentage > 0) {
        status = 'in_progress';
      }

      return await this.updateProgress({
        userId,
        labId,
        status,
        progressPercentage,
        completedExercises,
        pointsEarned: totalPoints,
      });
    } catch (error) {
      logger.error('Complete exercise error:', error);
      throw error;
    }
  }

  /**
   * Get user's progress for a specific lab
   */
  static async getUserLabProgress(userId: string, labId: string): Promise<UserProgress | null> {
    try {
      return await UserProgress.findOne({
        where: { userId, labId },
        include: [{ model: Lab, as: 'lab' }],
      });
    } catch (error) {
      logger.error('Get user lab progress error:', error);
      throw error;
    }
  }

  /**
   * Get all progress for a user
   */
  static async getUserProgress(userId: string): Promise<UserProgress[]> {
    try {
      return await UserProgress.findAll({
        where: { userId },
        include: [{ model: Lab, as: 'lab' }],
        order: [['lastAccessedAt', 'DESC']],
      });
    } catch (error) {
      logger.error('Get user progress error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<{
    totalLabs: number;
    completedLabs: number;
    inProgressLabs: number;
    totalPoints: number;
    averageScore: number;
    totalTimeSpent: number;
  }> {
    try {
      const progressRecords = await UserProgress.findAll({ where: { userId } });

      const stats = {
        totalLabs: progressRecords.length,
        completedLabs: progressRecords.filter((p) => p.status === 'completed').length,
        inProgressLabs: progressRecords.filter((p) => p.status === 'in_progress').length,
        totalPoints: progressRecords.reduce((sum, p) => sum + p.pointsEarned, 0),
        averageScore:
          progressRecords.length > 0
            ? Math.round(
                progressRecords.reduce((sum, p) => sum + p.score, 0) / progressRecords.length
              )
            : 0,
        totalTimeSpent: progressRecords.reduce((sum, p) => sum + p.timeSpent, 0),
      };

      return stats;
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      const users = await User.findAll({
        attributes: ['id', 'username', 'fullName', 'avatarUrl'],
      });

      const leaderboard = await Promise.all(
        users.map(async (user) => {
          const stats = await this.getUserStats(user.id);
          return {
            user: {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
              avatarUrl: user.avatarUrl,
            },
            ...stats,
          };
        })
      );

      // Sort by total points descending
      leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

      return leaderboard.slice(0, limit);
    } catch (error) {
      logger.error('Get leaderboard error:', error);
      throw error;
    }
  }

  /**
   * Reset progress for a lab
   */
  static async resetProgress(userId: string, labId: string): Promise<UserProgress> {
    try {
      const progress = await this.getOrCreateProgress(userId, labId);

      await progress.update({
        status: 'not_started',
        progressPercentage: 0,
        completedExercises: [],
        hintsUsed: 0,
        attempts: 0,
        timeSpent: 0,
        pointsEarned: 0,
        score: 0,
        notes: null,
        flaggedVulnerabilities: [],
        startedAt: null,
        completedAt: null,
      });

      logger.info(`Reset progress for user ${userId} on lab ${labId}`);
      return progress;
    } catch (error) {
      logger.error('Reset progress error:', error);
      throw error;
    }
  }
}

export default ProgressService;
