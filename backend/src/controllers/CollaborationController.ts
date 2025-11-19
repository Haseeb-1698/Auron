import { Request, Response } from 'express';
import { CollaborationSession } from '@models/CollaborationSession';
import { CollaborationParticipant } from '@models/CollaborationParticipant';
import { User } from '@models/User';
import { Lab } from '@models/Lab';
import { logger } from '@utils/logger';
import { Op } from 'sequelize';

/**
 * CollaborationController
 * Handles collaboration session management
 */
export class CollaborationController {
  /**
   * GET /api/collaboration/sessions
   * Get all collaboration sessions for the authenticated user
   */
  static async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Get sessions where user is host or participant
      const sessions = await CollaborationSession.findAll({
        where: {
          [Op.or]: [
            { hostId: userId },
            {
              '$participants.userId$': userId,
              '$participants.isActive$': true,
            },
          ],
        },
        include: [
          {
            model: User,
            as: 'host',
            attributes: ['id', 'username', 'email'],
          },
          {
            model: Lab,
            as: 'lab',
            attributes: ['id', 'title', 'description', 'difficulty'],
            required: false,
          },
          {
            model: CollaborationParticipant,
            as: 'participants',
            where: { isActive: true },
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error('Error fetching collaboration sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch collaboration sessions',
      });
    }
  }

  /**
   * GET /api/collaboration/sessions/active
   * Get all active collaboration sessions (public)
   */
  static async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await CollaborationSession.findAll({
        where: { status: 'active' },
        include: [
          {
            model: User,
            as: 'host',
            attributes: ['id', 'username'],
          },
          {
            model: Lab,
            as: 'lab',
            attributes: ['id', 'title', 'difficulty'],
            required: false,
          },
          {
            model: CollaborationParticipant,
            as: 'participants',
            where: { isActive: true },
            required: false,
            attributes: ['userId', 'role'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error('Error fetching active sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active sessions',
      });
    }
  }

  /**
   * GET /api/collaboration/sessions/:sessionId
   * Get a specific collaboration session
   */
  static async getSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.userId;

      const session = await CollaborationSession.findByPk(sessionId, {
        include: [
          {
            model: User,
            as: 'host',
            attributes: ['id', 'username', 'email'],
          },
          {
            model: Lab,
            as: 'lab',
            attributes: ['id', 'title', 'description', 'difficulty'],
            required: false,
          },
          {
            model: CollaborationParticipant,
            as: 'participants',
            where: { isActive: true },
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email'],
              },
            ],
          },
        ],
      });

      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      // Check if user has access (host, participant, or admin)
      const isHost = session.hostId === userId;
      const isParticipant = session.participants?.some(
        (p: any) => p.userId === userId && p.isActive
      );
      const isAdmin = req.user?.role === 'admin';

      if (!isHost && !isParticipant && !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Error fetching session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch session',
      });
    }
  }

  /**
   * POST /api/collaboration/create
   * Create a new collaboration session
   */
  static async createSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { name, labId, maxParticipants } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Validate lab exists if labId is provided
      if (labId) {
        const lab = await Lab.findByPk(labId);
        if (!lab) {
          res.status(404).json({
            success: false,
            message: 'Lab not found',
          });
          return;
        }
      }

      // Create session
      const session = await CollaborationSession.create({
        name,
        hostId: userId,
        labId: labId || null,
        maxParticipants: maxParticipants || 10,
        status: 'active',
        startedAt: new Date(),
      });

      // Add host as participant
      await CollaborationParticipant.create({
        sessionId: session.id,
        userId,
        role: 'host',
        isActive: true,
      });

      // Fetch complete session with associations
      const completeSession = await CollaborationSession.findByPk(session.id, {
        include: [
          {
            model: User,
            as: 'host',
            attributes: ['id', 'username', 'email'],
          },
          {
            model: Lab,
            as: 'lab',
            attributes: ['id', 'title', 'description', 'difficulty'],
            required: false,
          },
          {
            model: CollaborationParticipant,
            as: 'participants',
            where: { isActive: true },
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email'],
              },
            ],
          },
        ],
      });

      logger.info(`Collaboration session ${session.id} created by user ${userId}`);

      res.status(201).json({
        success: true,
        data: completeSession,
        message: 'Collaboration session created successfully',
      });
    } catch (error) {
      logger.error('Error creating collaboration session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create collaboration session',
      });
    }
  }

  /**
   * POST /api/collaboration/:sessionId/join
   * Join an existing collaboration session
   */
  static async joinSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Find session
      const session = await CollaborationSession.findByPk(sessionId, {
        include: [
          {
            model: CollaborationParticipant,
            as: 'participants',
            where: { isActive: true },
            required: false,
          },
        ],
      });

      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      if (session.status !== 'active') {
        res.status(400).json({
          success: false,
          message: 'Session is not active',
        });
        return;
      }

      // Check if max participants reached
      const activeParticipants = session.participants?.filter((p: any) => p.isActive) || [];
      if (activeParticipants.length >= session.maxParticipants) {
        res.status(400).json({
          success: false,
          message: 'Session is full',
        });
        return;
      }

      // Check if user is already in session
      const existingParticipant = await CollaborationParticipant.findOne({
        where: {
          sessionId,
          userId,
          isActive: true,
        },
      });

      if (existingParticipant) {
        res.status(400).json({
          success: false,
          message: 'Already in session',
        });
        return;
      }

      // Add participant
      await CollaborationParticipant.create({
        sessionId,
        userId,
        role: 'participant',
        isActive: true,
      });

      // Fetch updated session
      const updatedSession = await CollaborationSession.findByPk(sessionId, {
        include: [
          {
            model: User,
            as: 'host',
            attributes: ['id', 'username', 'email'],
          },
          {
            model: Lab,
            as: 'lab',
            attributes: ['id', 'title', 'description', 'difficulty'],
            required: false,
          },
          {
            model: CollaborationParticipant,
            as: 'participants',
            where: { isActive: true },
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email'],
              },
            ],
          },
        ],
      });

      logger.info(`User ${userId} joined collaboration session ${sessionId}`);

      res.json({
        success: true,
        data: updatedSession,
        message: 'Joined session successfully',
      });
    } catch (error) {
      logger.error('Error joining collaboration session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join collaboration session',
      });
    }
  }

  /**
   * POST /api/collaboration/:sessionId/leave
   * Leave a collaboration session
   */
  static async leaveSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Find participant
      const participant = await CollaborationParticipant.findOne({
        where: {
          sessionId,
          userId,
          isActive: true,
        },
      });

      if (!participant) {
        res.status(404).json({
          success: false,
          message: 'Not in session',
        });
        return;
      }

      // Mark as inactive
      await participant.update({
        isActive: false,
        leftAt: new Date(),
      });

      // Find session
      const session = await CollaborationSession.findByPk(sessionId);

      if (session) {
        // If host left or no active participants, end session
        if (session.hostId === userId) {
          await session.update({
            status: 'ended',
            endedAt: new Date(),
          });

          // Mark all participants as inactive
          await CollaborationParticipant.update(
            {
              isActive: false,
              leftAt: new Date(),
            },
            {
              where: {
                sessionId,
                isActive: true,
              },
            }
          );

          logger.info(`Collaboration session ${sessionId} ended (host left)`);
        } else {
          // Check if any participants remain
          const activeCount = await CollaborationParticipant.count({
            where: {
              sessionId,
              isActive: true,
            },
          });

          if (activeCount === 0) {
            await session.update({
              status: 'ended',
              endedAt: new Date(),
            });
            logger.info(`Collaboration session ${sessionId} ended (no participants)`);
          }
        }
      }

      logger.info(`User ${userId} left collaboration session ${sessionId}`);

      res.json({
        success: true,
        message: 'Left session successfully',
      });
    } catch (error) {
      logger.error('Error leaving collaboration session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to leave collaboration session',
      });
    }
  }

  /**
   * DELETE /api/collaboration/:sessionId
   * End/delete a collaboration session (host only)
   */
  static async endSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const session = await CollaborationSession.findByPk(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      // Only host or admin can end session
      if (session.hostId !== userId && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Only the host can end this session',
        });
        return;
      }

      // End session
      await session.update({
        status: 'ended',
        endedAt: new Date(),
      });

      // Mark all participants as inactive
      await CollaborationParticipant.update(
        {
          isActive: false,
          leftAt: new Date(),
        },
        {
          where: {
            sessionId,
            isActive: true,
          },
        }
      );

      logger.info(`Collaboration session ${sessionId} ended by user ${userId}`);

      res.json({
        success: true,
        message: 'Session ended successfully',
      });
    } catch (error) {
      logger.error('Error ending collaboration session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end collaboration session',
      });
    }
  }
}
