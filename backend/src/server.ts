import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

import { errorHandler } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { setupRoutes } from '@routes/index';
import { setupWebSocket } from '@/websocket';
import { connectDatabase } from '@config/database';
import { connectRedis } from '@config/redis';
import JobManager from '@/jobs';
import { ReportService } from '@services/ReportService';
import { swaggerSpec } from '@config/swagger';
import DockerService from '@services/DockerService';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

class App {
  public app: Application;
  private httpServer: HTTPServer;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
      },
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeWebSocket();
  }

  private initializeMiddleware(): void {
    // Security
    this.app.use(helmet());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      // Skip rate limiting for health check endpoint
      skip: (req) => req.path === '/health',
    });
    this.app.use(limiter);

    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static file serving for lab images and assets
    this.app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

    // Logging
    if (NODE_ENV === 'development') {
      this.app.use((req, _res, next) => {
        logger.info(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  private initializeRoutes(): void {
    // API Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Auron API Documentation',
    }));

    // API Routes
    setupRoutes(this.app);

    // Health check endpoint
    this.app.get('/health', (_, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeWebSocket(): void {
    setupWebSocket(this.io);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      logger.info('Database connected successfully');

      // Connect to Redis
      await connectRedis();
      logger.info('Redis connected successfully');

      // Initialize Docker service and network
      await DockerService.initialize();
      logger.info('Docker service initialized successfully');

      // Initialize report storage directory
      await ReportService.initialize();
      logger.info('Report storage initialized successfully');

      // Start background jobs
      JobManager.startAll();
      logger.info('Background jobs started successfully');

      // Start server
      this.httpServer.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
      });

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private gracefulShutdown(): void {
    logger.info('Received shutdown signal, closing gracefully...');

    // Stop background jobs
    JobManager.stopAll();

    // Close server
    this.httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
}

const server = new App();
server.start();

export default server;
