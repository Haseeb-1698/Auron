import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jwt';
import { User } from '@models/User';
import { logger } from '@utils/logger';

/**
 * WebSocket Configuration
 * Sets up Socket.IO for real-time communication
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

interface SocketWithUser extends Socket {
  userId?: string;
  user?: User;
}

export function setupWebSocket(io: SocketIOServer): void {
  // Authentication middleware
  io.use(async (socket: SocketWithUser, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await User.findByPk(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('Invalid or inactive user'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: SocketWithUser) => {
    logger.info(`WebSocket client connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle lab status subscription
    socket.on('subscribe:lab', (labId: string) => {
      socket.join(`lab:${labId}`);
      logger.debug(`User ${socket.userId} subscribed to lab ${labId}`);
    });

    // Handle lab status unsubscription
    socket.on('unsubscribe:lab', (labId: string) => {
      socket.leave(`lab:${labId}`);
      logger.debug(`User ${socket.userId} unsubscribed from lab ${labId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.userId}`);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error(`WebSocket error for user ${socket.userId}:`, error);
    });
  });

  logger.info('WebSocket server initialized');
}

/**
 * Emit lab status change to specific user
 */
export function emitLabStatusChange(
  io: SocketIOServer,
  userId: string,
  data: {
    instanceId: string;
    status: string;
    message?: string;
  }
): void {
  io.to(`user:${userId}`).emit('lab:status', data);
}

/**
 * Emit lab notification to lab subscribers
 */
export function emitLabNotification(
  io: SocketIOServer,
  labId: string,
  data: {
    type: string;
    message: string;
    metadata?: Record<string, unknown>;
  }
): void {
  io.to(`lab:${labId}`).emit('lab:notification', data);
}
