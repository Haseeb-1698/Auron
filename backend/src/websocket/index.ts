import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '@models/User';
import { logger } from '@utils/logger';

/**
 * WebSocket Configuration
 * Sets up Socket.IO for real-time communication
 * Features: Lab status updates, chat, collaboration, progress notifications
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

interface SocketWithUser extends Socket {
  userId?: string;
  user?: User;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  roomId: string;
}

interface CollaborationSession {
  sessionId: string;
  labId: string;
  hostUserId: string;
  participants: string[];
  screenSharing?: {
    userId: string;
    streamId: string;
  };
}

// Store active collaboration sessions
const collaborationSessions = new Map<string, CollaborationSession>();

// Store online users
const onlineUsers = new Map<string, Socket>();

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
    const userId = socket.userId!;
    logger.info(`WebSocket client connected: ${userId}`);

    // Track online user
    onlineUsers.set(userId, socket);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Emit user online status
    io.emit('user:online', { userId, username: socket.user?.username });

    // ============================================================================
    // LAB STATUS EVENTS
    // ============================================================================

    socket.on('subscribe:lab', (labId: string) => {
      socket.join(`lab:${labId}`);
      logger.debug(`User ${userId} subscribed to lab ${labId}`);
    });

    socket.on('unsubscribe:lab', (labId: string) => {
      socket.leave(`lab:${labId}`);
      logger.debug(`User ${userId} unsubscribed from lab ${labId}`);
    });

    // ============================================================================
    // CHAT EVENTS
    // ============================================================================

    socket.on('chat:join', (roomId: string) => {
      socket.join(`chat:${roomId}`);
      logger.debug(`User ${userId} joined chat room ${roomId}`);

      // Notify others in the room
      socket.to(`chat:${roomId}`).emit('chat:user-joined', {
        userId,
        username: socket.user?.username,
        timestamp: new Date(),
      });
    });

    socket.on('chat:leave', (roomId: string) => {
      socket.leave(`chat:${roomId}`);
      logger.debug(`User ${userId} left chat room ${roomId}`);

      // Notify others in the room
      socket.to(`chat:${roomId}`).emit('chat:user-left', {
        userId,
        username: socket.user?.username,
        timestamp: new Date(),
      });
    });

    socket.on('chat:message', (data: { roomId: string; message: string }) => {
      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        username: socket.user?.username || 'Anonymous',
        message: data.message,
        timestamp: new Date(),
        roomId: data.roomId,
      };

      // Broadcast message to room
      io.to(`chat:${data.roomId}`).emit('chat:message', chatMessage);
      logger.debug(`Chat message from ${userId} in room ${data.roomId}`);
    });

    socket.on('chat:typing', (data: { roomId: string; isTyping: boolean }) => {
      // Notify others that user is typing
      socket.to(`chat:${data.roomId}`).emit('chat:typing', {
        userId,
        username: socket.user?.username,
        isTyping: data.isTyping,
      });
    });

    // ============================================================================
    // COLLABORATION EVENTS
    // ============================================================================

    socket.on('collaboration:create-session', (data: { labId: string }) => {
      const sessionId = `session-${Date.now()}-${userId}`;
      const session: CollaborationSession = {
        sessionId,
        labId: data.labId,
        hostUserId: userId,
        participants: [userId],
      };

      collaborationSessions.set(sessionId, session);
      socket.join(`collab:${sessionId}`);

      socket.emit('collaboration:session-created', { session });
      logger.info(`Collaboration session ${sessionId} created by ${userId}`);
    });

    socket.on('collaboration:join-session', (data: { sessionId: string }) => {
      const session = collaborationSessions.get(data.sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Add participant
      if (!session.participants.includes(userId)) {
        session.participants.push(userId);
      }

      socket.join(`collab:${data.sessionId}`);

      // Notify all participants
      io.to(`collab:${data.sessionId}`).emit('collaboration:user-joined', {
        userId,
        username: socket.user?.username,
        session,
      });

      logger.info(`User ${userId} joined collaboration session ${data.sessionId}`);
    });

    socket.on('collaboration:leave-session', (data: { sessionId: string }) => {
      const session = collaborationSessions.get(data.sessionId);
      if (!session) return;

      // Remove participant
      session.participants = session.participants.filter((id) => id !== userId);

      socket.leave(`collab:${data.sessionId}`);

      // Notify all participants
      io.to(`collab:${data.sessionId}`).emit('collaboration:user-left', {
        userId,
        username: socket.user?.username,
      });

      // Delete session if host left or no participants
      if (session.hostUserId === userId || session.participants.length === 0) {
        collaborationSessions.delete(data.sessionId);
        io.to(`collab:${data.sessionId}`).emit('collaboration:session-ended');
        logger.info(`Collaboration session ${data.sessionId} ended`);
      }
    });

    socket.on('collaboration:screen-share-start', (data: { sessionId: string; streamId: string }) => {
      const session = collaborationSessions.get(data.sessionId);
      if (!session) return;

      session.screenSharing = {
        userId,
        streamId: data.streamId,
      };

      // Notify all participants
      socket.to(`collab:${data.sessionId}`).emit('collaboration:screen-share-started', {
        userId,
        username: socket.user?.username,
        streamId: data.streamId,
      });

      logger.info(`User ${userId} started screen sharing in session ${data.sessionId}`);
    });

    socket.on('collaboration:screen-share-stop', (data: { sessionId: string }) => {
      const session = collaborationSessions.get(data.sessionId);
      if (!session) return;

      session.screenSharing = undefined;

      // Notify all participants
      socket.to(`collab:${data.sessionId}`).emit('collaboration:screen-share-stopped', {
        userId,
      });

      logger.info(`User ${userId} stopped screen sharing in session ${data.sessionId}`);
    });

    // WebRTC signaling for peer-to-peer connections
    socket.on('webrtc:offer', (data: { sessionId: string; targetUserId: string; offer: any }) => {
      const targetSocket = onlineUsers.get(data.targetUserId);
      if (targetSocket) {
        targetSocket.emit('webrtc:offer', {
          fromUserId: userId,
          offer: data.offer,
        });
      }
    });

    socket.on('webrtc:answer', (data: { sessionId: string; targetUserId: string; answer: any }) => {
      const targetSocket = onlineUsers.get(data.targetUserId);
      if (targetSocket) {
        targetSocket.emit('webrtc:answer', {
          fromUserId: userId,
          answer: data.answer,
        });
      }
    });

    socket.on('webrtc:ice-candidate', (data: { sessionId: string; targetUserId: string; candidate: any }) => {
      const targetSocket = onlineUsers.get(data.targetUserId);
      if (targetSocket) {
        targetSocket.emit('webrtc:ice-candidate', {
          fromUserId: userId,
          candidate: data.candidate,
        });
      }
    });

    // ============================================================================
    // PROGRESS EVENTS
    // ============================================================================

    socket.on('subscribe:progress', () => {
      socket.join(`progress:${userId}`);
      logger.debug(`User ${userId} subscribed to progress updates`);
    });

    socket.on('unsubscribe:progress', () => {
      socket.leave(`progress:${userId}`);
      logger.debug(`User ${userId} unsubscribed from progress updates`);
    });

    // ============================================================================
    // INSTRUCTOR EVENTS
    // ============================================================================

    socket.on('instructor:monitor-student', (data: { studentId: string }) => {
      if (socket.user?.role === 'instructor' || socket.user?.role === 'admin') {
        socket.join(`monitor:${data.studentId}`);
        logger.info(`Instructor ${userId} monitoring student ${data.studentId}`);
      }
    });

    socket.on('instructor:stop-monitoring', (data: { studentId: string }) => {
      socket.leave(`monitor:${data.studentId}`);
      logger.info(`Instructor ${userId} stopped monitoring student ${data.studentId}`);
    });

    // ============================================================================
    // DISCONNECTION
    // ============================================================================

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${userId}`);

      // Remove from online users
      onlineUsers.delete(userId);

      // Emit user offline status
      io.emit('user:offline', { userId });

      // Clean up collaboration sessions
      collaborationSessions.forEach((session, sessionId) => {
        if (session.participants.includes(userId)) {
          session.participants = session.participants.filter((id) => id !== userId);

          // Notify others
          io.to(`collab:${sessionId}`).emit('collaboration:user-left', {
            userId,
            username: socket.user?.username,
          });

          // Delete if host left or empty
          if (session.hostUserId === userId || session.participants.length === 0) {
            collaborationSessions.delete(sessionId);
            io.to(`collab:${sessionId}`).emit('collaboration:session-ended');
          }
        }
      });
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error(`WebSocket error for user ${userId}:`, error);
    });
  });

  logger.info('WebSocket server initialized with chat, collaboration, and real-time features');
}

// ============================================================================
// UTILITY FUNCTIONS FOR EMITTING EVENTS
// ============================================================================

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
    progress?: number;
  }
): void {
  io.to(`user:${userId}`).emit('lab:status', data);
  logger.debug(`Lab status emitted to user ${userId}:`, data);
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
  logger.debug(`Lab notification emitted to lab ${labId}:`, data);
}

/**
 * Emit progress update to user
 */
export function emitProgressUpdate(
  io: SocketIOServer,
  userId: string,
  data: {
    labId: string;
    progressPercentage: number;
    pointsEarned: number;
    completedExercises: string[];
  }
): void {
  io.to(`progress:${userId}`).emit('progress:updated', data);
  logger.debug(`Progress update emitted to user ${userId}:`, data);
}

/**
 * Send chat message to room
 */
export function sendChatMessage(
  io: SocketIOServer,
  roomId: string,
  message: ChatMessage
): void {
  io.to(`chat:${roomId}`).emit('chat:message', message);
}

/**
 * Notify instructors about student activity
 */
export function notifyInstructors(
  io: SocketIOServer,
  studentId: string,
  data: {
    type: string;
    message: string;
    metadata?: Record<string, unknown>;
  }
): void {
  io.to(`monitor:${studentId}`).emit('instructor:student-activity', {
    studentId,
    ...data,
  });
}

/**
 * Get online users count
 */
export function getOnlineUsersCount(): number {
  return onlineUsers.size;
}

/**
 * Get active collaboration sessions
 */
export function getActiveCollaborationSessions(): CollaborationSession[] {
  return Array.from(collaborationSessions.values());
}
