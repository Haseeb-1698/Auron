import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { User } from '@models/User';
import { Lab } from '@models/Lab';
import { LabInstance } from '@models/LabInstance';
import { UserProgress } from '@models/UserProgress';
import AuthService from '@services/AuthService';
import { logger } from '@utils/logger';
import { Op } from 'sequelize';

/**
 * Admin Controller
 * Handles administrative operations
 * Requires admin role
 */

export class AdminController {
  /**
   * Get all users with filters
   * GET /api/admin/users
   */
  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, isActive, search, page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (search) {
        where[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { fullName: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password', 'twoFactorSecret'] },
      });

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      logger.error('Admin get users error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get users',
      });
    }
  }

  /**
   * Get user by ID
   * GET /api/admin/users/:id
   */
  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password', 'twoFactorSecret'] },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Get user's progress stats
      const progressRecords = await UserProgress.findAll({ where: { userId: id } });
      const stats = {
        totalLabs: progressRecords.length,
        completedLabs: progressRecords.filter((p) => p.status === 'completed').length,
        totalPoints: progressRecords.reduce((sum, p) => sum + p.pointsEarned, 0),
        averageScore:
          progressRecords.length > 0
            ? Math.round(
                progressRecords.reduce((sum, p) => sum + p.score, 0) / progressRecords.length
              )
            : 0,
      };

      res.status(200).json({
        success: true,
        data: { user, stats },
      });
    } catch (error: any) {
      logger.error('Admin get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user',
      });
    }
  }

  /**
   * Create new user
   * POST /api/admin/users
   */
  async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, fullName, role } = req.body;

      const user = await AuthService.register({
        username,
        email,
        password,
        fullName,
        role: role || 'student',
      });

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        message: 'User created successfully',
      });
    } catch (error: any) {
      logger.error('Admin create user error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create user',
      });
    }
  }

  /**
   * Update user
   * PUT /api/admin/users/:id
   */
  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { username, email, fullName, role, isActive, isVerified } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      await user.update({
        username: username || user.username,
        email: email || user.email,
        fullName: fullName || user.fullName,
        role: role || user.role,
        isActive: isActive !== undefined ? isActive : user.isActive,
        isVerified: isVerified !== undefined ? isVerified : user.isVerified,
      });

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
        },
        message: 'User updated successfully',
      });
    } catch (error: any) {
      logger.error('Admin update user error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user',
      });
    }
  }

  /**
   * Delete user
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user?.userId;

      if (id === adminUserId) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        });
        return;
      }

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      await user.destroy();

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      logger.error('Admin delete user error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete user',
      });
    }
  }

  /**
   * Reset user password
   * POST /api/admin/users/:id/reset-password
   */
  async resetUserPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      await AuthService.resetPassword(id, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error: any) {
      logger.error('Admin reset password error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reset password',
      });
    }
  }

  /**
   * Get system statistics
   * GET /api/admin/stats
   */
  async getSystemStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        activeUsers,
        totalLabs,
        activeLabs,
        totalInstances,
        runningInstances,
      ] = await Promise.all([
        User.count(),
        User.count({ where: { isActive: true } }),
        Lab.count(),
        Lab.count({ where: { isActive: true } }),
        LabInstance.count(),
        LabInstance.count({ where: { status: 'running' } }),
      ]);

      const usersByRole = await User.findAll({
        attributes: [
          'role',
          [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'count'],
        ],
        group: ['role'],
      });

      const stats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: usersByRole.map((r: any) => ({
            role: r.role,
            count: parseInt(r.dataValues.count),
          })),
        },
        labs: {
          total: totalLabs,
          active: activeLabs,
        },
        instances: {
          total: totalInstances,
          running: runningInstances,
        },
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Admin get system stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get system stats',
      });
    }
  }

  /**
   * Get recent activity
   * GET /api/admin/activity
   */
  async getRecentActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { limit = 50 } = req.query;

      const [recentUsers, recentInstances, recentProgress] = await Promise.all([
        User.findAll({
          limit: Number(limit),
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'username', 'email', 'role', 'createdAt'],
        }),
        LabInstance.findAll({
          limit: Number(limit),
          order: [['createdAt', 'DESC']],
          include: [
            { model: User, as: 'user', attributes: ['username'] },
            { model: Lab, as: 'lab', attributes: ['name'] },
          ],
        }),
        UserProgress.findAll({
          limit: Number(limit),
          order: [['updatedAt', 'DESC']],
          where: { status: 'completed' },
          include: [
            { model: User, as: 'user', attributes: ['username'] },
            { model: Lab, as: 'lab', attributes: ['name'] },
          ],
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          recentUsers,
          recentInstances,
          recentCompletions: recentProgress,
        },
      });
    } catch (error: any) {
      logger.error('Admin get recent activity error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get recent activity',
      });
    }
  }

  /**
   * Manage labs
   * GET /api/admin/labs
   */
  async getLabs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const labs = await Lab.findAll({
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data: labs,
      });
    } catch (error: any) {
      logger.error('Admin get labs error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get labs',
      });
    }
  }

  /**
   * Update lab
   * PUT /api/admin/labs/:id
   */
  async updateLab(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const lab = await Lab.findByPk(id);
      if (!lab) {
        res.status(404).json({
          success: false,
          message: 'Lab not found',
        });
        return;
      }

      await lab.update(updateData);

      res.status(200).json({
        success: true,
        data: lab,
        message: 'Lab updated successfully',
      });
    } catch (error: any) {
      logger.error('Admin update lab error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update lab',
      });
    }
  }
}

export default new AdminController();
