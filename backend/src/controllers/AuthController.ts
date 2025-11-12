import { Request, Response } from 'express';
import AuthService, { RegisterData, LoginData } from '@services/AuthService';
import { logger } from '@utils/logger';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData: RegisterData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        fullName: req.body.fullName,
        role: req.body.role,
      };

      const user = await AuthService.register(registerData);

      // Remove password from response
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      };

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: userResponse,
      });
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginData = {
        email: req.body.email,
        password: req.body.password,
        twoFactorCode: req.body.twoFactorCode,
      };

      const { user, tokens } = await AuthService.login(loginData);

      // Remove password from response
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isActive: user.isActive,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
      };

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          tokens,
        },
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const tokens = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { User } = await import('@models/User');
      const user = await User.findByPk(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isActive: user.isActive,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      };

      res.status(200).json({
        success: true,
        data: userResponse,
      });
    } catch (error: any) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get profile',
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const updateData = {
        fullName: req.body.fullName,
        bio: req.body.bio,
        avatarUrl: req.body.avatarUrl,
      };

      const user = await AuthService.updateProfile(userId, updateData);

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      };

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: userResponse,
      });
    } catch (error: any) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      await AuthService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  }

  /**
   * Enable 2FA
   */
  static async enable2FA(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { secret, qrCode } = await AuthService.enable2FA(userId);

      res.status(200).json({
        success: true,
        message: '2FA setup initialized. Scan the QR code and verify.',
        data: { secret, qrCode },
      });
    } catch (error: any) {
      logger.error('Enable 2FA error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to enable 2FA',
      });
    }
  }

  /**
   * Verify 2FA setup
   */
  static async verify2FA(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { code } = req.body;
      await AuthService.verify2FASetup(userId, code);

      res.status(200).json({
        success: true,
        message: '2FA enabled successfully',
      });
    } catch (error: any) {
      logger.error('Verify 2FA error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to verify 2FA',
      });
    }
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { password } = req.body;
      await AuthService.disable2FA(userId, password);

      res.status(200).json({
        success: true,
        message: '2FA disabled successfully',
      });
    } catch (error: any) {
      logger.error('Disable 2FA error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to disable 2FA',
      });
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  static async logout(_req: AuthRequest, res: Response): Promise<void> {
    try {
      // In a stateless JWT system, logout is handled client-side
      // Here we just acknowledge the logout
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Logout failed',
      });
    }
  }
}

export default AuthController;
