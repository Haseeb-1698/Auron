import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import CloudLabService from '@services/CloudLabService';
import LabService from '@services/LabService';
import { logger } from '@utils/logger';

/**
 * Lab Controller
 * Handles HTTP requests for lab management
 * Supports both cloud-based (Vultr VMs) and local (Docker) lab modes
 */

export class LabController {
  /**
   * Get the appropriate lab service based on LAB_MODE environment variable
   * - 'cloud': Uses CloudLabService (Vultr VMs)
   * - 'docker': Uses LabService (local Docker containers)
   */
  private getLabService() {
    const labMode = process.env.LAB_MODE || 'docker';
    return labMode === 'cloud' ? CloudLabService : LabService;
  }
  /**
   * Get all labs
   * GET /api/labs
   */
  async getAllLabs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { category, difficulty, search } = req.query;
      const userId = req.userId;
      const labService = this.getLabService();

      const labs = await labService.getAllLabs(
        {
          category: category as any,
          difficulty: difficulty as any,
          search: search as string,
          isActive: true,
        },
        userId
      );

      res.json({
        success: true,
        data: labs,
      });
    } catch (error) {
      logger.error('Get all labs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch labs',
      });
    }
  }

  /**
   * Get lab by ID
   * GET /api/labs/:id
   */
  async getLabById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const labService = this.getLabService();

      const lab = await labService.getLabById(id, userId);
      if (!lab) {
        res.status(404).json({
          success: false,
          message: 'Lab not found',
        });
        return;
      }

      res.json({
        success: true,
        data: lab,
      });
    } catch (error) {
      logger.error('Get lab by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lab',
      });
    }
  }

  /**
   * Start a lab instance
   * POST /api/labs/:id/start
   */
  async startLab(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { timeoutOverride } = req.body;
      const labService = this.getLabService();

      const instance = await labService.startLab({
        userId,
        labId: id,
        timeoutOverride,
      });

      res.status(201).json({
        success: true,
        data: instance,
        message: 'Lab instance started successfully',
      });
    } catch (error) {
      logger.error('Start lab error:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to start lab',
      });
    }
  }

  /**
   * Stop a lab instance
   * POST /api/labs/instances/:instanceId/stop
   */
  async stopLab(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { instanceId } = req.params;
      const userId = req.userId!;
      const labService = this.getLabService();

      const instance = await labService.stopLab(instanceId, userId);

      res.json({
        success: true,
        data: instance,
        message: 'Lab instance stopped successfully',
      });
    } catch (error) {
      logger.error('Stop lab error:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to stop lab',
      });
    }
  }

  /**
   * Restart a lab instance
   * POST /api/labs/instances/:instanceId/restart
   */
  async restartLab(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { instanceId } = req.params;
      const userId = req.userId!;
      const labService = this.getLabService();

      const instance = await labService.restartLab(instanceId, userId);

      res.json({
        success: true,
        data: instance,
        message: 'Lab instance restarted successfully',
      });
    } catch (error) {
      logger.error('Restart lab error:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to restart lab',
      });
    }
  }

  /**
   * Reset a lab instance
   * POST /api/labs/instances/:instanceId/reset
   */
  async resetLab(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { instanceId } = req.params;
      const userId = req.userId!;
      const labService = this.getLabService();

      const instance = await labService.resetLab(instanceId, userId);

      res.json({
        success: true,
        data: instance,
        message: 'Lab instance reset successfully',
      });
    } catch (error) {
      logger.error('Reset lab error:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to reset lab',
      });
    }
  }

  /**
   * Get user's lab instances
   * GET /api/labs/instances
   */
  async getUserInstances(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const labService = this.getLabService();

      const instances = await labService.getUserInstances(userId);

      res.json({
        success: true,
        data: instances,
      });
    } catch (error) {
      logger.error('Get user instances error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lab instances',
      });
    }
  }

  /**
   * Get lab instance details
   * GET /api/labs/instances/:instanceId
   */
  async getInstanceDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { instanceId } = req.params;
      const userId = req.userId!;
      const labService = this.getLabService();

      const instance = await labService.getInstanceDetails(instanceId, userId);

      res.json({
        success: true,
        data: instance,
      });
    } catch (error) {
      logger.error('Get instance details error:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch instance details',
      });
    }
  }
}

export default new LabController();
