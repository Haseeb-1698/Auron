import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '@utils/logger';

/**
 * Middleware to validate request data against a Joi schema
 */
export function validate(schema: Joi.ObjectSchema | { body?: Joi.ObjectSchema; params?: Joi.ObjectSchema; query?: Joi.ObjectSchema }) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Handle both direct schema and schema object with body/params/query
    const bodySchema = ('body' in schema ? schema.body : schema) as Joi.ObjectSchema;

    if (!bodySchema) {
      next();
      return;
    }

    const { error } = bodySchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation error:', errors);

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
}
