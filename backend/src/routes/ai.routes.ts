import { Router } from 'express';
import AIController from '@controllers/AIController';
import { authMiddleware } from '@middleware/auth';
import { validateRequest } from '@middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const generateHintSchema = Joi.object({
  labId: Joi.string().uuid().required(),
  exerciseId: Joi.string().required(),
  currentProgress: Joi.string().allow('', null).optional(),
  previousHints: Joi.array().items(Joi.string()).optional(),
  userCode: Joi.string().allow('', null).optional(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
});

const explainVulnerabilitySchema = Joi.object({
  vulnerabilityType: Joi.string().required(),
  context: Joi.string().allow('', null).optional(),
  detailedExplanation: Joi.boolean().optional(),
});

const analyzeCodeSchema = Joi.object({
  code: Joi.string().required(),
  language: Joi.string().required(),
  context: Joi.string().allow('', null).optional(),
});

const learningPathSchema = Joi.object({
  progressData: Joi.object().optional(),
});

const validateSolutionSchema = Joi.object({
  labId: Joi.string().uuid().required(),
  exerciseId: Joi.string().required(),
  solution: Joi.string().required(),
  expectedOutcome: Joi.string().optional(),
});

// All routes require authentication
router.use(authMiddleware);

// Generate AI hint
router.post('/hint', validateRequest(generateHintSchema), AIController.generateHint);

// Explain vulnerability
router.post('/explain', validateRequest(explainVulnerabilitySchema), AIController.explainVulnerability);

// Analyze code
router.post('/analyze-code', validateRequest(analyzeCodeSchema), AIController.analyzeCode);

// Generate learning path
router.post('/learning-path', validateRequest(learningPathSchema), AIController.generateLearningPath);

// Get AI history
router.get('/history', AIController.getHistory);

// Validate solution
router.post('/validate-solution', validateRequest(validateSolutionSchema), AIController.validateSolution);

export default router;
