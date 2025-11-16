import axios, { AxiosInstance } from 'axios';
import { logger } from '@utils/logger';

/**
 * Vultr Cloud Service
 * Manages Vultr VM instances for isolated lab environments
 * Each lab gets its own dedicated VM instance
 */

export interface VultrInstanceConfig {
  region: string;
  plan: string;
  osId: number;
  label: string;
  hostname?: string;
  userdata?: string;
  tags?: string[];
}

export interface VultrInstance {
  id: string;
  os: string;
  ram: number;
  disk: number;
  mainIp: string;
  vcpuCount: number;
  region: string;
  plan: string;
  status: string;
  powerStatus: string;
  serverState: string;
  label: string;
  internalIp: string;
  tags: string[];
  features: string[];
}

export interface VultrRegion {
  id: string;
  city: string;
  country: string;
  continent: string;
  options: string[];
}

export interface VultrPlan {
  id: string;
  vcpuCount: number;
  ram: number;
  disk: number;
  bandwidth: number;
  monthlyCost: number;
  type: string;
  locations: string[];
}

export class VultrService {
  private client: AxiosInstance;
  private readonly API_BASE = 'https://api.vultr.com/v2';
  private readonly API_KEY: string;
  private readonly DEFAULT_REGION: string;
  private readonly DEFAULT_PLAN: string;
  private readonly DEFAULT_OS_ID = 1743; // Docker on Ubuntu 22.04

  constructor() {
    this.API_KEY = process.env.VULTR_API_KEY || '';
    this.DEFAULT_REGION = process.env.VULTR_DEFAULT_REGION || 'ewr'; // New Jersey
    this.DEFAULT_PLAN = process.env.VULTR_DEFAULT_PLAN || 'vc2-1c-1gb'; // 1 CPU, 1GB RAM

    if (!this.API_KEY) {
      logger.warn('VULTR_API_KEY not set. Vultr service will not function.');
    } else {
      logger.info(`VultrService initialized with API key: ${this.API_KEY.substring(0, 8)}...${this.API_KEY.substring(this.API_KEY.length - 4)}`);
      logger.info(`Using region: ${this.DEFAULT_REGION}, plan: ${this.DEFAULT_PLAN}`);
    }

    this.client = axios.create({
      baseURL: this.API_BASE,
      headers: {
        Authorization: `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Create a new Vultr instance with Docker pre-installed
   */
  async createInstance(
    userId: string,
    labId: string,
    labName: string,
    containerConfig: {
      image: string;
      ports: Array<{ container: number }>;
      environment?: Record<string, string>;
    }
  ): Promise<VultrInstance> {
    try {
      const label = `auron-lab-${userId.substring(0, 8)}-${labId.substring(0, 8)}`;
      const hostname = `lab-${labId.substring(0, 8)}.auron.cloud`;

      // Generate startup script to run Docker container
      const startupScript = this.generateStartupScript(containerConfig);

      const config: VultrInstanceConfig = {
        region: this.DEFAULT_REGION,
        plan: this.DEFAULT_PLAN,
        osId: this.DEFAULT_OS_ID, // Docker pre-installed Ubuntu
        label,
        hostname,
        userdata: Buffer.from(startupScript).toString('base64'),
        tags: ['auron', 'lab', `user-${userId}`, `lab-${labId}`],
      };

      logger.info(`Creating Vultr instance for lab ${labName}`, { userId, labId });

      // Transform camelCase to snake_case for Vultr API
      const apiPayload = {
        region: config.region,
        plan: config.plan,
        os_id: config.osId,
        label: config.label,
        hostname: config.hostname,
        user_data: config.userdata,
        tags: config.tags,
      };

      logger.debug(`Vultr API payload:`, apiPayload);

      const response = await this.client.post('/instances', apiPayload);
      const instance = response.data.instance as VultrInstance;

      logger.info(`Vultr instance created: ${instance.id}`, {
        ip: instance.mainIp,
        label: instance.label,
      });

      // Wait for instance to be active
      await this.waitForInstanceReady(instance.id);

      return instance;
    } catch (error) {
      logger.error('Failed to create Vultr instance:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Vultr API error: ${error.response?.data?.error || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get instance details
   */
  async getInstance(instanceId: string): Promise<VultrInstance> {
    try {
      const response = await this.client.get(`/instances/${instanceId}`);
      return response.data.instance as VultrInstance;
    } catch (error) {
      logger.error(`Failed to get Vultr instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * List all instances (optionally filter by tags)
   */
  async listInstances(tags?: string[]): Promise<VultrInstance[]> {
    try {
      const params: any = {};
      if (tags && tags.length > 0) {
        params.tag = tags.join(',');
      }

      const response = await this.client.get('/instances', { params });
      return response.data.instances as VultrInstance[];
    } catch (error) {
      logger.error('Failed to list Vultr instances:', error);
      return [];
    }
  }

  /**
   * Stop (halt) an instance
   */
  async stopInstance(instanceId: string): Promise<void> {
    try {
      await this.client.post(`/instances/${instanceId}/halt`);
      logger.info(`Vultr instance stopped: ${instanceId}`);
    } catch (error) {
      logger.error(`Failed to stop Vultr instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Start (reboot) an instance
   */
  async startInstance(instanceId: string): Promise<void> {
    try {
      await this.client.post(`/instances/${instanceId}/start`);
      logger.info(`Vultr instance started: ${instanceId}`);
    } catch (error) {
      logger.error(`Failed to start Vultr instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Reboot an instance
   */
  async rebootInstance(instanceId: string): Promise<void> {
    try {
      await this.client.post(`/instances/${instanceId}/reboot`);
      logger.info(`Vultr instance rebooted: ${instanceId}`);
    } catch (error) {
      logger.error(`Failed to reboot Vultr instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Delete (destroy) an instance
   */
  async deleteInstance(instanceId: string): Promise<void> {
    try {
      await this.client.delete(`/instances/${instanceId}`);
      logger.info(`Vultr instance deleted: ${instanceId}`);
    } catch (error) {
      logger.error(`Failed to delete Vultr instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Wait for instance to be ready (active and running)
   */
  private async waitForInstanceReady(
    instanceId: string,
    maxWaitTime = 180000 // 3 minutes
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const instance = await this.getInstance(instanceId);

        if (
          instance.status === 'active' &&
          instance.serverState === 'ok' &&
          instance.powerStatus === 'running'
        ) {
          logger.info(`Vultr instance ${instanceId} is ready`);
          return;
        }

        logger.debug(`Waiting for instance ${instanceId}...`, {
          status: instance.status,
          serverState: instance.serverState,
          powerStatus: instance.powerStatus,
        });

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        logger.warn(`Error checking instance status: ${error}`);
      }
    }

    throw new Error(`Instance ${instanceId} did not become ready within ${maxWaitTime}ms`);
  }

  /**
   * Generate cloud-init startup script for Docker container
   */
  private generateStartupScript(containerConfig: {
    image: string;
    ports: Array<{ container: number }>;
    environment?: Record<string, string>;
  }): string {
    const portMappings = containerConfig.ports
      .map((p) => `-p ${p.container}:${p.container}`)
      .join(' ');

    const envVars = containerConfig.environment
      ? Object.entries(containerConfig.environment)
          .map(([key, value]) => `-e ${key}="${value}"`)
          .join(' ')
      : '';

    return `#!/bin/bash
# Auron Lab Container Startup Script

# Wait for Docker to be ready
while ! docker info > /dev/null 2>&1; do
  echo "Waiting for Docker..."
  sleep 2
done

# Pull and run container
docker pull ${containerConfig.image}
docker run -d \\
  --name auron-lab \\
  --restart unless-stopped \\
  ${portMappings} \\
  ${envVars} \\
  ${containerConfig.image}

# Log status
echo "Container started: ${containerConfig.image}"
docker ps
`;
  }

  /**
   * Get available regions
   */
  async getRegions(): Promise<VultrRegion[]> {
    try {
      const response = await this.client.get('/regions');
      return response.data.regions as VultrRegion[];
    } catch (error) {
      logger.error('Failed to get Vultr regions:', error);
      return [];
    }
  }

  /**
   * Get available plans
   */
  async getPlans(type = 'vc2'): Promise<VultrPlan[]> {
    try {
      const response = await this.client.get('/plans', {
        params: { type },
      });
      return response.data.plans as VultrPlan[];
    } catch (error) {
      logger.error('Failed to get Vultr plans:', error);
      return [];
    }
  }

  /**
   * Get instance bandwidth usage
   */
  async getInstanceBandwidth(instanceId: string): Promise<any> {
    try {
      const response = await this.client.get(`/instances/${instanceId}/bandwidth`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get bandwidth for instance ${instanceId}:`, error);
      return null;
    }
  }

  /**
   * Health check for Vultr API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/account');
      return response.status === 200;
    } catch (error) {
      logger.error('Vultr health check failed:', error);
      return false;
    }
  }

  /**
   * Get account info and balance
   */
  async getAccountInfo(): Promise<{
    balance: number;
    pendingCharges: number;
    lastPaymentDate: string;
  } | null> {
    try {
      const response = await this.client.get('/account');
      return response.data.account;
    } catch (error) {
      logger.error('Failed to get Vultr account info:', error);
      return null;
    }
  }

  /**
   * Cleanup instances older than specified hours
   */
  async cleanupOldInstances(_olderThanHours = 24): Promise<number> {
    try {
      const instances = await this.listInstances(['auron']);
      let deletedCount = 0;

      for (const instance of instances) {
        // Vultr doesn't return creation time directly, use tags or labels
        // For now, delete instances with 'cleanup' tag
        if (instance.tags.includes('cleanup')) {
          await this.deleteInstance(instance.id);
          deletedCount++;
        }
      }

      logger.info(`Cleaned up ${deletedCount} Vultr instances`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup Vultr instances:', error);
      return 0;
    }
  }
}

export default new VultrService();
