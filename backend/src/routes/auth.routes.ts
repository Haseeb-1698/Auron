import { Router } from 'express';
import AuthController from '@controllers/AuthController';
import { authMiddleware } from '@middleware/auth';
import { validateRequest } from '@middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().max(100).optional(),
  role: Joi.string().valid('student', 'instructor', 'admin').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  twoFactorCode: Joi.string().length(6).optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  fullName: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).optional(),
  avatarUrl: Joi.string().uri().optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const verify2FASchema = Joi.object({
  code: Joi.string().length(6).required(),
});

const disable2FASchema = Joi.object({
  password: Joi.string().required(),
});

// Public routes
router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/refresh-token', validateRequest(refreshTokenSchema), AuthController.refreshToken);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, validateRequest(updateProfileSchema), AuthController.updateProfile);
router.post('/change-password', authMiddleware, validateRequest(changePasswordSchema), AuthController.changePassword);
router.post('/logout', authMiddleware, AuthController.logout);

// 2FA routes
router.post('/2fa/enable', authMiddleware, AuthController.enable2FA);
router.post('/2fa/verify', authMiddleware, validateRequest(verify2FASchema), AuthController.verify2FA);
router.post('/2fa/disable', authMiddleware, validateRequest(disable2FASchema), AuthController.disable2FA);

export default router;
