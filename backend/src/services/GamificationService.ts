import { Badge } from '@models/Badge';
import { UserBadge } from '@models/UserBadge';
import { UserProgress } from '@models/UserProgress';
import { logger } from '@utils/logger';

export class GamificationService {
  /**
   * Check and award badges based on user progress
   */
  static async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    try {
      const progressRecords = await UserProgress.findAll({ where: { userId } });
      const allBadges = await Badge.findAll({ where: { isActive: true } });
      const userBadges = await UserBadge.findAll({ where: { userId } });

      const newlyEarnedBadges: UserBadge[] = [];

      for (const badge of allBadges) {
        const existingUserBadge = userBadges.find((ub) => ub.badgeId === badge.id);

        if (existingUserBadge?.isUnlocked) {
          continue; // Already unlocked
        }

        let progress = 0;
        let shouldUnlock = false;

        switch (badge.requirementType) {
          case 'labs_completed':
            const completedCount = progressRecords.filter((p) => p.status === 'completed').length;
            progress = Math.min(100, (completedCount / badge.requirementValue) * 100);
            shouldUnlock = completedCount >= badge.requirementValue;
            break;

          case 'points_earned':
            const totalPoints = progressRecords.reduce((sum, p) => sum + p.pointsEarned, 0);
            progress = Math.min(100, (totalPoints / badge.requirementValue) * 100);
            shouldUnlock = totalPoints >= badge.requirementValue;
            break;

          case 'specific_lab':
            const specificLabProgress = progressRecords.find(
              (p) => p.labId === badge.requirementValue.toString() && p.status === 'completed'
            );
            progress = specificLabProgress ? 100 : 0;
            shouldUnlock = !!specificLabProgress;
            break;

          default:
            break;
        }

        if (existingUserBadge) {
          // Update progress
          await existingUserBadge.update({
            progress: Math.round(progress),
            isUnlocked: shouldUnlock,
            earnedAt: shouldUnlock ? new Date() : existingUserBadge.earnedAt,
          });

          if (shouldUnlock && !existingUserBadge.isUnlocked) {
            newlyEarnedBadges.push(existingUserBadge);
          }
        } else {
          // Create new user badge record
          const newUserBadge = await UserBadge.create({
            userId,
            badgeId: badge.id,
            progress: Math.round(progress),
            isUnlocked: shouldUnlock,
            earnedAt: shouldUnlock ? new Date() : undefined,
          });

          if (shouldUnlock) {
            newlyEarnedBadges.push(newUserBadge);
          }
        }
      }

      if (newlyEarnedBadges.length > 0) {
        logger.info(`User ${userId} earned ${newlyEarnedBadges.length} new badges`);
      }

      return newlyEarnedBadges;
    } catch (error) {
      logger.error('Check and award badges error:', error);
      throw error;
    }
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await UserBadge.findAll({
      where: { userId },
      include: [{ model: Badge, as: 'badge' }],
      order: [['earnedAt', 'DESC']],
    });
  }

  /**
   * Get all badges with user progress
   */
  static async getAllBadgesWithProgress(userId: string): Promise<any[]> {
    const allBadges = await Badge.findAll({ where: { isActive: true } });
    const userBadges = await UserBadge.findAll({ where: { userId } });

    return allBadges.map((badge) => {
      const userBadge = userBadges.find((ub) => ub.badgeId === badge.id);
      return {
        ...badge.toJSON(),
        userProgress: userBadge ? userBadge.progress : 0,
        isUnlocked: userBadge ? userBadge.isUnlocked : false,
        earnedAt: userBadge ? userBadge.earnedAt : null,
      };
    });
  }

  /**
   * Create default badges
   */
  static async createDefaultBadges(): Promise<void> {
    const defaultBadges = [
      {
        name: 'First Steps',
        description: 'Complete your first lab',
        category: 'completion',
        requirementType: 'labs_completed',
        requirementValue: 1,
        pointsReward: 10,
        rarity: 'common',
      },
      {
        name: 'Lab Enthusiast',
        description: 'Complete 5 labs',
        category: 'completion',
        requirementType: 'labs_completed',
        requirementValue: 5,
        pointsReward: 50,
        rarity: 'rare',
      },
      {
        name: 'Lab Master',
        description: 'Complete all 4 main labs',
        category: 'completion',
        requirementType: 'labs_completed',
        requirementValue: 4,
        pointsReward: 100,
        rarity: 'epic',
      },
      {
        name: 'Point Hunter',
        description: 'Earn 500 points',
        category: 'points',
        requirementType: 'points_earned',
        requirementValue: 500,
        pointsReward: 25,
        rarity: 'common',
      },
      {
        name: 'Point Master',
        description: 'Earn 2000 points',
        category: 'points',
        requirementType: 'points_earned',
        requirementValue: 2000,
        pointsReward: 100,
        rarity: 'epic',
      },
      {
        name: 'Legend',
        description: 'Earn 5000 points',
        category: 'points',
        requirementType: 'points_earned',
        requirementValue: 5000,
        pointsReward: 250,
        rarity: 'legendary',
      },
    ];

    for (const badgeData of defaultBadges) {
      const existing = await Badge.findOne({ where: { name: badgeData.name } });
      if (!existing) {
        await Badge.create(badgeData);
        logger.info(`Created badge: ${badgeData.name}`);
      }
    }
  }
}

export default GamificationService;
