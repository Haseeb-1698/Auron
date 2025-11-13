import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { User } from '@models/User';
import { logger } from '@utils/logger';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: 'student' | 'instructor' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static readonly JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  private static readonly SALT_ROUNDS = 10;

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          $or: [{ email: data.email }, { username: data.username }],
        } as any,
      });

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new Error('Email already registered');
        }
        if (existingUser.username === data.username) {
          throw new Error('Username already taken');
        }
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Create user
      const user = await User.create({
        username: data.username,
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.fullName?.split(' ')[0],
        lastName: data.fullName?.split(' ').slice(1).join(' '),
        role: data.role || 'student',
        isActive: true,
        isVerified: false,
      });

      logger.info(`New user registered: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(data: LoginData): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Find user
      const user = await User.findOne({ where: { email: data.email } });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await this.comparePassword(data.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!data.twoFactorCode) {
          throw new Error('2FA code required');
        }
        const is2FAValid = this.verify2FACode(user.twoFactorSecret!, data.twoFactorCode);
        if (!is2FAValid) {
          throw new Error('Invalid 2FA code');
        }
      }

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Generate tokens
      const tokens = this.generateTokens(user);

      logger.info(`User logged in: ${user.email}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as TokenPayload;

      const user = await User.findByPk(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate JWT tokens
   */
  private static generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password
   */
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Enable 2FA for user
   */
  static async enable2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Auron (${user.email})`,
      length: 32,
    });

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    // Save secret (don't enable yet, wait for verification)
    await user.update({ twoFactorSecret: secret.base32 });

    return { secret: secret.base32, qrCode };
  }

  /**
   * Verify and activate 2FA
   */
  static async verify2FASetup(userId: string, code: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA not initialized');
    }

    const isValid = this.verify2FACode(user.twoFactorSecret, code);
    if (!isValid) {
      throw new Error('Invalid 2FA code');
    }

    // Enable 2FA
    await user.update({ twoFactorEnabled: true });
    logger.info(`2FA enabled for user: ${user.email}`);

    return true;
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(userId: string, password: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Disable 2FA
    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    logger.info(`2FA disabled for user: ${user.email}`);
    return true;
  }

  /**
   * Verify 2FA code
   */
  private static verify2FACode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await this.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await this.hashPassword(newPassword);
    await user.update({ passwordHash: hashedPassword });

    logger.info(`Password changed for user: ${user.email}`);
    return true;
  }

  /**
   * Reset password (admin or forgot password flow)
   */
  static async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await user.update({ passwordHash: hashedPassword });

    logger.info(`Password reset for user: ${user.email}`);
    return true;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: Partial<{
      fullName: string;
      bio: string;
      avatarUrl: string;
    }>
  ): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update(data);
    logger.info(`Profile updated for user: ${user.email}`);

    return user;
  }

  /**
   * Deactivate user account
   */
  static async deactivateAccount(userId: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ isActive: false });
    logger.info(`Account deactivated for user: ${user.email}`);

    return true;
  }

  /**
   * Reactivate user account
   */
  static async reactivateAccount(userId: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ isActive: true });
    logger.info(`Account reactivated for user: ${user.email}`);

    return true;
  }
}

export default AuthService;
