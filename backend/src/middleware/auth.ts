import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '@models/User';
import { logger } from '@utils/logger';
import AuthService from '@services/AuthService';

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  userId?: string;
}

/**
 * Verify JWT token and attach user to request
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = AuthService.verifyAccessToken(token);

      const user = await User.findByPk(payload.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Invalid or inactive user',
        });
        return;
      }

      req.user = payload;
      req.userId = user.id;
      next();
    } catch (error) {
      logger.warn('JWT verification failed:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
}

// Alias for backward compatibility
export const authenticate = authMiddleware;

/**
 * Require specific role(s)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const payload = AuthService.verifyAccessToken(token);

    const user = await User.findByPk(payload.userId);
    if (user && user.isActive) {
      req.user = payload;
      req.userId = user.id;
    }
  } catch (error) {
    // Ignore errors for optional auth
    logger.debug('Optional auth failed:', error);
  }

  next();
}
