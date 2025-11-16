import { Lab } from '@models/Lab';
import { LabInstance, LabInstanceStatus } from '@models/LabInstance';
import LabRepository, { LabFilters } from '@repositories/LabRepository';
import LabInstanceRepository from '@repositories/LabInstanceRepository';
import VultrService from './VultrService';
import LiquidMetalService from './LiquidMetalService';
import { logger } from '@utils/logger';
import redis from '@config/redis';

/**
 * Cloud Lab Service
 * Manages lab environments using Vultr cloud VMs
 * Each lab instance gets a dedicated VM with Docker container
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

export class CloudLabService {
  private readonly INSTANCE_CACHE_TTL = 300; // 5 minutes
  private readonly MAX_GLOBAL_INSTANCES = 100; // Increased for cloud
  private readonly DEFAULT_VM_TIMEOUT = 3600000; // 1 hour

  /**
   * Get all labs with optional filters
   */
  async getAllLabs(filters?: LabFilters, userId?: string): Promise<LabWithStatus[]> {
    const labs = await LabRepository.findAll(filters);

    if (userId) {
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
   * Start a lab instance on Vultr cloud VM
   */
  async startLab(options: StartLabOptions): Promise<LabInstance> {
    const { userId, labId, timeoutOverride } = options;

    // Validate lab exists
    const lab = await LabRepository.findById(labId);
    if (!lab) {
      throw new Error('Lab not found');
    }

    // Debug log
    logger.info(`[Cloud] Lab ${lab.name} isActive value: ${lab.isActive} (type: ${typeof lab.isActive})`);

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
      // Calculate expiration time
      const timeoutDuration = timeoutOverride || lab.timeoutDuration || this.DEFAULT_VM_TIMEOUT;
      const expiresAt = new Date(Date.now() + timeoutDuration);

      logger.info(`Starting Vultr VM for lab ${lab.name}`, { userId, labId });

      // Create Vultr VM instance
      const vultrInstance = await VultrService.createInstance(
        userId,
        labId,
        lab.name,
        lab.containerConfig
      );

      // Generate access URLs for each port
      const accessUrls: string[] = [];
      if (lab.containerConfig.ports) {
        for (const port of lab.containerConfig.ports) {
          accessUrls.push(`http://${vultrInstance.mainIp}:${port.container}`);
        }
      }

      // Create database instance record
      const instance = await LabInstanceRepository.create({
        labId,
        userId,
        cloudInstanceId: vultrInstance.id,
        publicIp: vultrInstance.mainIp,
        internalIp: vultrInstance.internalIp,
        cloudProvider: 'vultr',
        status: LabInstanceStatus.RUNNING,
        ports: lab.containerConfig.ports.map((p) => ({
          container: p.container,
          host: p.container, // Same port on VM
        })),
        accessUrl: accessUrls[0], // Primary access URL
        cloudInstanceInfo: {
          region: vultrInstance.region,
          plan: vultrInstance.plan,
          ram: vultrInstance.ram,
          vcpu: vultrInstance.vcpuCount,
          label: vultrInstance.label,
        },
        startedAt: new Date(),
        expiresAt,
        autoCleanup: true,
      });

      // Cache instance info
      await this.cacheInstanceInfo(instance.id, instance);

      // Schedule auto-cleanup
      this.scheduleAutoCleanup(instance.id, timeoutDuration);

      // Store in SmartMemory (AI tracking) - non-blocking
      LiquidMetalService.storeInSmartMemory({
        userId,
        labId,
        event: 'lab_started',
        metadata: {
          instanceId: instance.id,
          cloudProvider: 'vultr',
          region: vultrInstance.region,
        },
        timestamp: new Date().toISOString(),
      }).catch((err) => {
        logger.warn('Failed to store lab start in SmartMemory:', err);
      });

      logger.info(`Lab instance started on Vultr`, {
        instanceId: instance.id,
        vultrId: vultrInstance.id,
        ip: vultrInstance.mainIp,
      });

      return instance;
    } catch (error) {
      logger.error(`Failed to start lab ${labId}:`, error);
      throw new Error(`Failed to start lab: ${(error as Error).message}`);
    }
  }

  /**
   * Stop a lab instance (destroys Vultr VM)
   */
  async stopLab(instanceId: string, userId: string): Promise<LabInstance> {
    const instance = await LabInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Lab instance not found');
    }

    if (instance.userId !== userId) {
      throw new Error('Unauthorized to stop this lab instance');
    }

    if (!instance.cloudInstanceId) {
      throw new Error('Cloud instance ID not found - this is not a cloud lab instance');
    }

    if (instance.status === LabInstanceStatus.STOPPED) {
      return instance;
    }

    try {
      // Update status to stopping
      await instance.update({ status: LabInstanceStatus.STOPPING });

      // Delete Vultr VM instance
      await VultrService.deleteInstance(instance.cloudInstanceId);

      // Update instance
      await instance.update({
        status: LabInstanceStatus.STOPPED,
        stoppedAt: new Date(),
      });

      // Clear cache
      await this.clearInstanceCache(instanceId);

      // Store in SmartMemory
      await LiquidMetalService.storeInSmartMemory({
        userId,
        labId: instance.labId,
        event: 'lab_stopped',
        metadata: {
          instanceId: instance.id,
          duration: instance.stoppedAt
            ? instance.stoppedAt.getTime() - instance.startedAt!.getTime()
            : 0,
        },
        timestamp: new Date().toISOString(),
      });

      logger.info(`Lab instance stopped and VM destroyed: ${instanceId}`);
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
   * Restart a lab instance (reboot Vultr VM)
   */
  async restartLab(instanceId: string, userId: string): Promise<LabInstance> {
    const instance = await LabInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Lab instance not found');
    }

    if (instance.userId !== userId) {
      throw new Error('Unauthorized to restart this lab instance');
    }

    if (!instance.cloudInstanceId) {
      throw new Error('Cloud instance ID not found - this is not a cloud lab instance');
    }

    try {
      // Update status
      await instance.update({ status: LabInstanceStatus.STARTING });

      // Reboot Vultr VM
      await VultrService.rebootInstance(instance.cloudInstanceId);

      // Extend expiration time
      const lab = instance.lab;
      const newExpiresAt = new Date(Date.now() + (lab.timeoutDuration || this.DEFAULT_VM_TIMEOUT));

      // Update instance
      await instance.update({
        status: LabInstanceStatus.RUNNING,
        expiresAt: newExpiresAt,
        restartCount: instance.restartCount + 1,
        errorMessage: null,
      });

      // Reschedule cleanup
      this.scheduleAutoCleanup(instanceId, lab.timeoutDuration || this.DEFAULT_VM_TIMEOUT);

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
   * Reset a lab instance (destroy and create new VM)
   */
  async resetLab(instanceId: string, userId: string): Promise<LabInstance> {
    const instance = await LabInstanceRepository.findById(instanceId);
    if (!instance) {
      throw new Error('Lab instance not found');
    }

    if (instance.userId !== userId) {
      throw new Error('Unauthorized to reset this lab instance');
    }

    if (!instance.cloudInstanceId) {
      throw new Error('Cloud instance ID not found - this is not a cloud lab instance');
    }

    try {
      // Delete old Vultr VM
      await VultrService.deleteInstance(instance.cloudInstanceId);

      // Delete old instance record
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

    if (!instance.cloudInstanceId) {
      throw new Error('Cloud instance ID not found - this is not a cloud lab instance');
    }

    // Update VM status from Vultr
    try {
      const vultrInstance = await VultrService.getInstance(instance.cloudInstanceId);

      // Map Vultr status to our status
      let status = instance.status;
      if (vultrInstance.powerStatus === 'running') {
        status = LabInstanceStatus.RUNNING;
      } else if (vultrInstance.powerStatus === 'stopped') {
        status = LabInstanceStatus.STOPPED;
      }

      if (status !== instance.status) {
        await instance.update({ status });
      }
    } catch (error) {
      logger.warn(`Failed to update instance status from Vultr ${instanceId}:`, error);
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
        // Skip if no cloud instance ID (Docker lab)
        if (!instance.cloudInstanceId) {
          continue;
        }

        // Delete Vultr VM
        await VultrService.deleteInstance(instance.cloudInstanceId);

        // Update instance status
        await instance.update({
          status: LabInstanceStatus.EXPIRED,
          stoppedAt: new Date(),
        });

        // If auto-cleanup enabled, delete instance record
        if (instance.autoCleanup) {
          await LabInstanceRepository.delete(instance.id);
        }

        cleanedCount++;
        logger.info(`Cleaned up expired instance: ${instance.id}`);
      } catch (error) {
        logger.error(`Failed to cleanup instance ${instance.id}:`, error);
      }
    }

    logger.info(`Cleanup completed: ${cleanedCount} instances cleaned`);
    return cleanedCount;
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

  /**
   * Get estimated cost for running a lab
   */
  async getLabCost(labId: string, durationHours = 1): Promise<number> {
    const lab = await LabRepository.findById(labId);
    if (!lab) {
      return 0;
    }

    // Vultr vc2-1c-1gb plan costs ~$6/month = $0.009/hour
    // vc2-2c-4gb costs ~$18/month = $0.027/hour
    const costPerHour = 0.01; // $0.01/hour for basic plan
    return costPerHour * durationHours;
  }
}

export default new CloudLabService();
