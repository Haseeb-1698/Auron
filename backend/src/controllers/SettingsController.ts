import { QueryTypes } from 'sequelize';
import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { logger } from '@utils/logger';
import crypto from 'crypto';

/**
 * SettingsController
 * Handles user settings and preferences
 */
export class SettingsController {
  // Encryption key for sensitive data (in production, use proper key management)
  private static ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'change-this-in-production-32-chars!';

  /**
   * Encrypt sensitive data
   */
  private static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SettingsController.ENCRYPTION_KEY.slice(0, 32)), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private static decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SettingsController.ENCRYPTION_KEY.slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Mask API key for display (show only last 4 characters)
   */
  private static maskApiKey(apiKey: string): string {
    if (apiKey.length <= 4) return '****';
    return '*'.repeat(apiKey.length - 4) + apiKey.slice(-4);
  }

  /**
   * Get all user settings
   * GET /api/settings
   */
  static async getSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { db } = await import('@config/database');

      const [settings] = await db.query(
        `SELECT * FROM user_settings WHERE user_id = :userId`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      );

      // If no settings exist, return defaults
      if (!settings) {
        res.json({
          success: true,
          data: {
            labSettings: {
              defaultDuration: 60,
              autoShutdown: true,
              notifications: true,
              theme: 'auto',
            },
            cloudSettings: [],
          },
        });
        return;
      }

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Failed to get settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve settings',
      });
    }
  }

  /**
   * Save cloud provider settings (API keys encrypted)
   * POST /api/settings/cloud
   */
  static async saveCloudSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { provider, apiKey, region, instanceType, sshKey } = req.body;

      // Encrypt the API key before storing
      const encryptedKey = SettingsController.encrypt(apiKey);

      const { db } = await import('@config/database');

      // Insert or update cloud settings
      await db.query(
        `INSERT INTO user_cloud_settings (id, user_id, provider, api_key_encrypted, region, instance_type, ssh_key, created_at, updated_at)
         VALUES (gen_random_uuid(), :userId, :provider, :apiKey, :region, :instanceType, :sshKey, NOW(), NOW())
         ON CONFLICT (user_id, provider)
         DO UPDATE SET
           api_key_encrypted = EXCLUDED.api_key_encrypted,
           region = EXCLUDED.region,
           instance_type = EXCLUDED.instance_type,
           ssh_key = EXCLUDED.ssh_key,
           updated_at = NOW()`,
        {
          replacements: {
            userId,
            provider,
            apiKey: encryptedKey,
            region: region || null,
            instanceType: instanceType || null,
            sshKey: sshKey || null,
          },
        }
      );

      logger.info(`Cloud settings saved for user ${userId}: ${provider}`);

      res.status(201).json({
        success: true,
        message: 'Cloud settings saved successfully',
        data: {
          provider,
          apiKey: SettingsController.maskApiKey(apiKey),
          region,
          instanceType,
        },
      });
    } catch (error) {
      logger.error('Failed to save cloud settings:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save cloud settings',
      });
    }
  }

  /**
   * Save lab settings
   * POST /api/settings/labs
   */
  static async saveLabSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { defaultDuration, autoShutdown, notifications, theme } = req.body;

      const { db } = await import('@config/database');

      // Insert or update lab settings
      await db.query(
        `INSERT INTO user_settings (id, user_id, lab_default_duration, lab_auto_shutdown, notifications_enabled, theme, created_at, updated_at)
         VALUES (gen_random_uuid(), :userId, :defaultDuration, :autoShutdown, :notifications, :theme, NOW(), NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           lab_default_duration = COALESCE(EXCLUDED.lab_default_duration, user_settings.lab_default_duration),
           lab_auto_shutdown = COALESCE(EXCLUDED.lab_auto_shutdown, user_settings.lab_auto_shutdown),
           notifications_enabled = COALESCE(EXCLUDED.notifications_enabled, user_settings.notifications_enabled),
           theme = COALESCE(EXCLUDED.theme, user_settings.theme),
           updated_at = NOW()`,
        {
          replacements: {
            userId,
            defaultDuration: defaultDuration || null,
            autoShutdown: autoShutdown !== undefined ? autoShutdown : null,
            notifications: notifications !== undefined ? notifications : null,
            theme: theme || null,
          },
        }
      );

      logger.info(`Lab settings saved for user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Lab settings saved successfully',
      });
    } catch (error) {
      logger.error('Failed to save lab settings:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save lab settings',
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/settings/profile
   */
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { displayName, email, avatar, bio } = req.body;

      const { User } = await import('@models/User');

      const user = await User.findByPk(userId);

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Update fields if provided
      if (displayName) user.displayName = displayName;
      if (email) user.email = email;
      if (avatar) user.avatar = avatar;
      if (bio !== undefined) user.bio = bio;

      await user.save();

      logger.info(`Profile updated for user ${userId}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
        },
      });
    } catch (error) {
      logger.error('Failed to update profile:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update profile',
      });
    }
  }

  /**
   * Get cloud settings (without exposing full API keys)
   * GET /api/settings/cloud
   */
  static async getCloudSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { db } = await import('@config/database');

      const settings = await db.query(
        `SELECT id, provider, region, instance_type, created_at, updated_at
         FROM user_cloud_settings
         WHERE user_id = :userId`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      );

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      logger.error('Failed to get cloud settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cloud settings',
      });
    }
  }

  /**
   * Delete cloud settings for a provider
   * DELETE /api/settings/cloud/:provider
   */
  static async deleteCloudSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { provider } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { db } = await import('@config/database');

      const result = await db.query(
        `DELETE FROM user_cloud_settings
         WHERE user_id = :userId AND provider = :provider`,
        {
          replacements: { userId, provider },
        }
      );

      logger.info(`Cloud settings deleted for user ${userId}: ${provider}`);

      res.json({
        success: true,
        message: 'Cloud settings deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete cloud settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete cloud settings',
      });
    }
  }
}
