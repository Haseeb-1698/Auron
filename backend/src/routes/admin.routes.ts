import { Router } from 'express';
import AdminController from '@controllers/AdminController';
import { authMiddleware, requireRole } from '@middleware/auth';
import { validateRequest } from '@middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().max(100).optional(),
  role: Joi.string().valid('student', 'instructor', 'admin').optional(),
});

const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  fullName: Joi.string().max(100).optional(),
  role: Joi.string().valid('student', 'instructor', 'admin').optional(),
  isActive: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional(),
});

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required(),
});

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

// User management
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.post('/users', validateRequest(createUserSchema), AdminController.createUser);
router.put('/users/:id', validateRequest(updateUserSchema), AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);
router.post('/users/:id/reset-password', validateRequest(resetPasswordSchema), AdminController.resetUserPassword);

// System stats
router.get('/stats', AdminController.getSystemStats);
router.get('/activity', AdminController.getRecentActivity);

// Lab management
router.get('/labs', AdminController.getLabs);
router.put('/labs/:id', AdminController.updateLab);

export default router;
