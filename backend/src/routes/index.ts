import { Application } from 'express';
import authRoutes from './auth.routes';
import labsRoutes from './labs.routes';
import progressRoutes from './progress.routes';
import aiRoutes from './ai.routes';
import { notFoundHandler } from '@middleware/errorHandler';

/**
 * Route Configuration
 * Sets up all API routes
 */

export function setupRoutes(app: Application): void {
  const apiPrefix = process.env.API_PREFIX || '/api';

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // API routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/labs`, labsRoutes);
  app.use(`${apiPrefix}/progress`, progressRoutes);
  app.use(`${apiPrefix}/ai`, aiRoutes);

  // 404 handler
  app.use(notFoundHandler);
}
