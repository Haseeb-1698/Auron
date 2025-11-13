import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { setupRoutes } from '@routes/index';
import { setupWebSocket } from '@/websocket';
import { connectDatabase } from '@config/database';
import { connectRedis } from '@config/redis';
import JobManager from '@/jobs';
import { ReportService } from '@services/ReportService';

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
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (NODE_ENV === 'development') {
      this.app.use((req, _res, next) => {
        logger.info(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  private initializeRoutes(): void {
    setupRoutes(this.app);
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

      // Initialize report storage directory
      await ReportService.initialize();
      logger.info('Reports directory initialized');

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
