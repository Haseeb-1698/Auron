import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';

/**
 * Feature flags from environment variables
 */
export const featureFlags = {
  TWO_FACTOR_AUTH: process.env.ENABLE_2FA === 'true',
  EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  OAUTH: process.env.ENABLE_OAUTH === 'true',
  AI_EXPLANATIONS: process.env.ENABLE_AI_EXPLANATIONS !== 'false', // Default enabled
  COLLABORATION: process.env.ENABLE_COLLABORATION === 'true',
  CLOUD_LABS: process.env.ENABLE_CLOUD_LABS !== 'false', // Default enabled
  GAMIFICATION: process.env.ENABLE_GAMIFICATION !== 'false', // Default enabled
};

/**
 * Middleware to check if a feature is enabled
 * Returns 403 if feature is disabled
 */
export function requireFeature(featureName: keyof typeof featureFlags) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!featureFlags[featureName]) {
      logger.warn(`Feature "${featureName}" is disabled, request blocked`);
      res.status(403).json({
        success: false,
        message: `Feature "${featureName}" is not currently available`,
        featureDisabled: true,
      });
      return;
    }
    next();
  };
}

/**
 * Middleware to optionally check feature flags
 * Sets req.featureEnabled for conditional logic
 */
export function checkFeature(featureName: keyof typeof featureFlags) {
  return (req: Request, res: Response, next: NextFunction) => {
    (req as any).featureEnabled = featureFlags[featureName];
    next();
  };
}

/**
 * Get all feature flags status
 */
export function getFeatureFlags(): typeof featureFlags {
  return { ...featureFlags };
}

/**
 * Log feature flags on startup
 */
export function logFeatureFlags(): void {
  logger.info('Feature Flags Status:');
  Object.entries(featureFlags).forEach(([key, value]) => {
    logger.info(`  ${key}: ${value ? '✅ ENABLED' : '❌ DISABLED'}`);
  });
}
