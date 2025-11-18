import { Application } from 'express';
import authRoutes from './auth.routes';
import labsRoutes from './labs.routes';
import progressRoutes from './progress.routes';
import aiRoutes from './ai.routes';
import adminRoutes from './admin.routes';
import gamificationRoutes from './gamification.routes';
import scanRoutes from './scan.routes';
import reportRoutes from './report.routes';
import collaborationRoutes from './collaboration.routes';
import settingsRoutes from './settings.routes';
import { notFoundHandler } from '@middleware/errorHandler';
import { getFeatureFlags } from '@middleware/featureFlags';

/**
 * Route Configuration
 * Sets up all API routes
 */

export function setupRoutes(app: Application): void {
  const apiPrefix = process.env.API_PREFIX || '/api';

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Feature flags endpoint (public)
  app.get(`${apiPrefix}/features`, (_req, res) => {
    res.json({
      success: true,
      data: getFeatureFlags(),
    });
  });

  // API routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/labs`, labsRoutes);
  app.use(`${apiPrefix}/progress`, progressRoutes);
  app.use(`${apiPrefix}/ai`, aiRoutes);
  app.use(`${apiPrefix}/admin`, adminRoutes);
  app.use(`${apiPrefix}/gamification`, gamificationRoutes);
  app.use(`${apiPrefix}/scans`, scanRoutes);
  app.use(`${apiPrefix}/reports`, reportRoutes);
  app.use(`${apiPrefix}/collaboration`, collaborationRoutes);
  app.use(`${apiPrefix}/settings`, settingsRoutes);

  // 404 handler
  app.use(notFoundHandler);
}
