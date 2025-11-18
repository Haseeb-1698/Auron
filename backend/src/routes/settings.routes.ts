import { Router } from 'express';
import { SettingsController } from '@controllers/SettingsController';
import { authMiddleware } from '@middleware/auth';
import { validate } from '@middleware/validation';
import Joi from 'joi';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * Validation Schemas
 */
const cloudSettingsSchema = {
  body: Joi.object({
    provider: Joi.string().valid('vultr', 'aws', 'digitalocean', 'azure', 'gcp').required(),
    apiKey: Joi.string().required(),
    region: Joi.string().optional(),
    instanceType: Joi.string().optional(),
    sshKey: Joi.string().optional(),
  }),
};

const labSettingsSchema = {
  body: Joi.object({
    defaultDuration: Joi.number().integer().min(30).max(480).optional(),
    autoShutdown: Joi.boolean().optional(),
    notifications: Joi.boolean().optional(),
    theme: Joi.string().valid('light', 'dark', 'auto').optional(),
  }),
};

const updateProfileSchema = {
  body: Joi.object({
    displayName: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    avatar: Joi.string().uri().optional(),
    bio: Joi.string().max(500).optional(),
  }),
};

/**
 * Routes
 */

// Get all user settings
router.get('/', SettingsController.getSettings);

// Update cloud provider settings (encrypted)
router.post('/cloud', validate(cloudSettingsSchema), SettingsController.saveCloudSettings);

// Update lab settings
router.post('/labs', validate(labSettingsSchema), SettingsController.saveLabSettings);

// Update user profile
router.put('/profile', validate(updateProfileSchema), SettingsController.updateProfile);

// Delete cloud settings (remove API keys)
router.delete('/cloud/:provider', SettingsController.deleteCloudSettings);

// Get cloud settings (without exposing full API key)
router.get('/cloud', SettingsController.getCloudSettings);

export default router;
