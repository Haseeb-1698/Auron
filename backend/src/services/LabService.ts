import { Lab } from '@models/Lab';
import { LabInstance, LabInstanceStatus } from '@models/LabInstance';
import LabRepository, { LabFilters } from '@repositories/LabRepository';
import LabInstanceRepository from '@repositories/LabInstanceRepository';
import DockerService from './DockerService';
import { logger } from '@utils/logger';
import redis from '@config/redis';

/**
 * Lab Service
 * Business logic for lab environment management
 * Handles lab lifecycle, container orchestration, and resource management
 */

export interface StartLabOptions {
  userId: string;
  labId: string;
  timeoutOverride?: number;
}

export interface LabWithStatus extends Lab {
  userInstances?: LabInstance[];
  isRunning?: boolean;
}

export class LabService {
  private readonly INSTANCE_CACHE_TTL = 300; // 5 minutes
  private readonly MAX_GLOBAL_INSTANCES = 50;

  /**
   * Get all labs with optional filters
   */
  async getAllLabs(filters?: LabFilters, userId?: string): Promise<LabWithStatus[]> {
    const labs = await LabRepository.findAll(filters);

    if (userId) {
      // Attach user's instances to each lab
      const instances = await LabInstanceRepository.findAll({ userId });
      const instancesByLab = instances.reduce((acc, instance) => {
        if (!acc[instance.labId]) {
          acc[instance.labId] = [];
        }
        acc[instance.labId].push(instance);
        return acc;
      }, {} as Record<string, LabInstance[]>);

      return labs.map((lab) => {
        const labWithStatus = lab.toJSON() as LabWithStatus;
        labWithStatus.userInstances = instancesByLab[lab.id] || [];
        labWithStatus.isRunning = labWithStatus.userInstances.some(
          (i) => i.status === LabInstanceStatus.RUNNING && !i.isExpired()
        );
        return labWithStatus;
      });
    }

    return labs as LabWithStatus[];
  }

  /**
   * Get lab by ID
   */
  async getLabById(labId: string, userId?: string): Promise<LabWithStatus | null> {
    const lab = await LabRepository.findById(labId);
    if (!lab) {
      return null;
    }

    const labWithStatus = lab.toJSON() as LabWithStatus;

    if (userId) {
      labWithStatus.userInstances = await LabInstanceRepository.findActiveByUserAndLab(
        userId,
        labId
      );
      labWithStatus.isRunning = labWithStatus.userInstances.some(
        (i) => i.status === LabInstanceStatus.RUNNING
      );
    }

    return labWithStatus;
  }

  /**
   * Start a lab instance for a user
   */
  async startLab(options: StartLabOptions): Promise<LabInstance> {
    const { userId, labId, timeoutOverride } = options;

    // Validate lab exists
    const lab = await LabRepository.findById(labId);
    if (!lab) {
      throw new Error('Lab not found');
    }

    // Debug log
    logger.info(`Lab ${lab.name} isActive value: ${lab.isActive} (type: ${typeof lab.isActive})`);

    if (!lab.isActive) {
      throw new Error('Lab is not active');
    }

    // Check user's active instances for this lab
    const activeInstances = await LabInstanceRepository.findActiveByUserAndLab(userId, labId);
    if (activeInstances.length >= lab.maxInstancesPerUser) {
      throw new Error(
        `Maximum ${lab.maxInstancesPerUser} instances per user for this lab. Please stop existing instances first.`
      );
    }

    // Check total active instances for user
    const userActiveCount = await LabInstanceRepository.countActiveByUser(userId);
    const maxUserInstances = parseInt(process.env.MAX_CONTAINERS_PER_USER || '5', 10);
    if (userActiveCount >= maxUserInstances) {
      throw new Error(`Maximum ${maxUserInstances} active instances allowed per user`);
    }

    // Check global instance limit
    const globalActiveInstances = await LabInstanceRepository.findAll({
      status: LabInstanceStatus.RUNNING,
    });
    if (globalActiveInstances.length >= this.MAX_GLOBAL_INSTANCES) {
      throw new Error('System is at capacity. Please try again later.');
    }

    try {
      // Create instance record
      const timeoutDuration = timeoutOverride || lab.timeoutDuration;
      const expiresAt = new Date(Date.now() + timeoutDuration);

      const instance = await LabInstanceRepository.create({
        labId,
        userId,
        containerId: '', // Will be updated after container creation
        status: LabInstanceStatus.STARTING,
        expiresAt,
        autoCleanup: true,
      });

      // Create and start container
      logger.info(`Starting lab ${labId} for user ${userId}`);
      const containerInfo = await DockerService.createContainer(
        lab.containerConfig,
        userId,
        labId
      );

      // Update instance with container info
      await instance.update({
        containerId: containerInfo.id,
        containerName: containerInfo.name,
        status: LabInstanceStatus.RUNNING,
        ports: containerInfo.ports,
        accessUrl: this.generateAccessUrl(containerInfo.ports),
        startedAt: new Date(),
        containerInfo: containerInfo as any,
      });

      // Cache instance info
      await this.cacheInstanceInfo(instance.id, instance);

      // Schedule auto-cleanup
      this.scheduleAutoCleanup(instance.id, timeoutDuration);

      logger.info(`Lab instance started: ${instance.id}`);
      return instance;
    } catch (error) {
      logger.error(`Failed to start lab ${labId}:`, error);
      throw new Error(`Failed to start lab: ${(error as Error).message}`);
    }
  }

  /**
   * Stop a lab instance
   */
  async stopLab(instanceId: string, userId: string): Promise<LabInstance> {
    const instance = await LabInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Lab instance not found');
    }

    if (instance.userId !== userId) {
      throw new Error('Unauthorized to stop this lab instance');
    }

    if (instance.status === LabInstanceStatus.STOPPED) {
      return instance;
    }

    try {
      // Update status to stopping
      await instance.update({ status: LabInstanceStatus.STOPPING });

      // Stop container
      if (instance.containerId) {
        await DockerService.stopContainer(instance.containerId);
      }

      // Update instance
      await instance.update({
        status: LabInstanceStatus.STOPPED,
        stoppedAt: new Date(),
      });

      // Clear cache
      await this.clearInstanceCache(instanceId);

      logger.info(`Lab instance stopped: ${instanceId}`);
      return instance;
    } catch (error) {
      logger.error(`Failed to stop lab instance ${instanceId}:`, error);
      await instance.update({
        status: LabInstanceStatus.ERROR,
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Restart a lab instance
   */
  async restartLab(instanceId: string, userId: string): Promise<LabInstance> {
    const instance = await LabInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Lab instance not found');
    }

    if (instance.userId !== userId) {
      throw new Error('Unauthorized to restart this lab instance');
    }

    if (!instance.canBeRestarted()) {
      throw new Error('Lab instance cannot be restarted in current state');
    }

    try {
      // Update status
      await instance.update({
        status: LabInstanceStatus.STARTING,
        restartCount: instance.restartCount + 1,
      });

      // Restart container
      if (!instance.containerId) {
        throw new Error('Container ID not found');
      }
      await DockerService.restartContainer(instance.containerId);

      // Extend expiration time
      const lab = instance.lab;
      if (!lab) {
        throw new Error('Lab not found');
      }
      const newExpiresAt = new Date(Date.now() + lab.timeoutDuration);

      // Update instance
      await instance.update({
        status: LabInstanceStatus.RUNNING,
        expiresAt: newExpiresAt,
        errorMessage: null,
      });

      // Reschedule cleanup
      this.scheduleAutoCleanup(instanceId, lab.timeoutDuration);

      logger.info(`Lab instance restarted: ${instanceId}`);
      return instance;
    } catch (error) {
      logger.error(`Failed to restart lab instance ${instanceId}:`, error);
      await instance.update({
        status: LabInstanceStatus.ERROR,
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Reset a lab instance (stop and start fresh)
   */
  async resetLab(instanceId: string, userId: string): Promise<LabInstance> {
    const instance = await LabInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Lab instance not found');
    }

    if (instance.userId !== userId) {
      throw new Error('Unauthorized to reset this lab instance');
    }

    try {
      // Remove old container
      if (instance.containerId) {
        await DockerService.removeContainer(instance.containerId, true);
      }

      // Delete old instance
      await LabInstanceRepository.delete(instanceId);

      // Start new instance
      const newInstance = await this.startLab({
        userId,
        labId: instance.labId,
      });

      logger.info(`Lab instance reset: ${instanceId} -> ${newInstance.id}`);
      return newInstance;
    } catch (error) {
      logger.error(`Failed to reset lab instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's lab instances
   */
  async getUserInstances(userId: string): Promise<LabInstance[]> {
    return await LabInstanceRepository.findAll({ userId });
  }

  /**
   * Get lab instance details
   */
  async getInstanceDetails(instanceId: string, userId: string): Promise<LabInstance> {
    const instance = await LabInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Lab instance not found');
    }

    if (instance.userId !== userId) {
      throw new Error('Unauthorized to view this lab instance');
    }

    // Update container status
    if (instance.containerId) {
      try {
        const containerInfo = await DockerService.getContainerInfo(instance.containerId);
        if (containerInfo && containerInfo.status !== instance.status) {
          await instance.update({ status: containerInfo.status as LabInstanceStatus });
        }
      } catch (error) {
        logger.warn(`Failed to update container status for instance ${instanceId}:`, error);
      }
    }

    return instance;
  }

  /**
   * Cleanup expired instances
   */
  async cleanupExpiredInstances(): Promise<number> {
    const expiredInstances = await LabInstanceRepository.findExpired();
    let cleanedCount = 0;

    for (const instance of expiredInstances) {
      try {
        if (instance.containerId) {
          await DockerService.stopContainer(instance.containerId);
        }
        await instance.update({
          status: LabInstanceStatus.EXPIRED,
          stoppedAt: new Date(),
        });

        if (instance.autoCleanup && instance.containerId) {
          await DockerService.removeContainer(instance.containerId, true);
          await LabInstanceRepository.delete(instance.id);
        }

        cleanedCount++;
        logger.info(`Cleaned up expired instance: ${instance.id}`);
      } catch (error) {
        logger.error(`Failed to cleanup instance ${instance.id}:`, error);
      }
    }

    // Also cleanup orphaned containers
    const dockerCleanedCount = await DockerService.cleanupExpiredContainers();
    cleanedCount += dockerCleanedCount;

    logger.info(`Cleanup completed: ${cleanedCount} instances cleaned`);
    return cleanedCount;
  }

  /**
   * Generate access URL for instance
   */
  private generateAccessUrl(ports: Array<{ container: number; host: number }>): string {
    if (ports.length === 0) {
      return '';
    }

    const primaryPort = ports[0];
    const host = process.env.PUBLIC_HOST || 'localhost';
    return `http://${host}:${primaryPort.host}`;
  }

  /**
   * Schedule automatic cleanup for instance
   */
  private scheduleAutoCleanup(instanceId: string, timeout: number): void {
    setTimeout(async () => {
      try {
        const instance = await LabInstanceRepository.findById(instanceId);
        if (instance && instance.isExpired() && instance.isRunning()) {
          logger.info(`Auto-cleanup triggered for instance: ${instanceId}`);
          await this.stopLab(instanceId, instance.userId);
        }
      } catch (error) {
        logger.error(`Auto-cleanup failed for instance ${instanceId}:`, error);
      }
    }, timeout);
  }

  /**
   * Cache instance information in Redis
   */
  private async cacheInstanceInfo(instanceId: string, instance: LabInstance): Promise<void> {
    try {
      const key = `lab:instance:${instanceId}`;
      await redis.setex(key, this.INSTANCE_CACHE_TTL, JSON.stringify(instance));
    } catch (error) {
      logger.warn('Failed to cache instance info:', error);
    }
  }

  /**
   * Clear instance cache
   */
  private async clearInstanceCache(instanceId: string): Promise<void> {
    try {
      const key = `lab:instance:${instanceId}`;
      await redis.del(key);
    } catch (error) {
      logger.warn('Failed to clear instance cache:', error);
    }
  }
}

export default new LabService();
