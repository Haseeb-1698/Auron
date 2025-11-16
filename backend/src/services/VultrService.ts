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
      let instance = response.data.instance as VultrInstance;

      logger.info(`Vultr instance created: ${instance.id}`, {
        ip: instance.mainIp,
        label: instance.label,
      });

      // Wait for instance to be active and running
      await this.waitForInstanceReady(instance.id);

      // Get updated instance info with actual IP
      const updatedInstance: any = await this.getInstance(instance.id);

      // Vultr API returns snake_case but we need camelCase - extract the IP
      const vmIp = updatedInstance.main_ip || updatedInstance.mainIp || '';
      logger.info(`✅ VM created successfully with IP: ${vmIp}`);
      logger.info(`🔧 VM is booting and Docker container is starting. This may take 2-5 minutes.`);
      logger.info(`📝 Users can access the VM via SSH or wait for the container to start.`);

      // Return the original instance (has the correct format for database)
      instance = updatedInstance;

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
   * Get instance password (only available for first 24 hours after creation)
   */
  async getInstancePassword(instanceId: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/instances/${instanceId}/user-data`);
      // Try to get default password - Vultr sets a default root password
      const userData = response.data;
      if (userData && userData.default_password) {
        return userData.default_password;
      }

      // If no password in user data, try getting from instance details
      const instance = await this.getInstance(instanceId);
      return (instance as any).default_password || null;
    } catch (error) {
      logger.warn(`Failed to get password for instance ${instanceId}:`, error);
      return null;
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
    let lastLoggedStatus = '';

    logger.info(`⏳ Waiting for Vultr VM ${instanceId} to become ready...`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const instance = await this.getInstance(instanceId);
        const currentStatus = `${instance.status}/${instance.serverState || 'none'}/${instance.powerStatus || 'none'}`;

        // Log status changes and full instance object for debugging
        if (currentStatus !== lastLoggedStatus) {
          logger.info(`VM Status: ${instance.status}, Server: ${instance.serverState || 'undefined'}, Power: ${instance.powerStatus || 'undefined'}, IP: ${instance.mainIp || 'not-assigned'}`);
          logger.info(`Full instance data: ${JSON.stringify(instance)}`);
          lastLoggedStatus = currentStatus;
        }

        // Check if instance is active - Vultr API returns status='active' when VM is ready
        // Don't require mainIp as it might be assigned later
        if (instance.status === 'active') {
          logger.info(`✅ Vultr VM ${instanceId} is active (IP: ${instance.mainIp || 'being-assigned'})`);

          // Wait additional time for VM to fully boot and Docker to start
          logger.info(`⏳ Waiting 45 seconds for VM boot and Docker container to start...`);
          await new Promise((resolve) => setTimeout(resolve, 45000));

          logger.info(`✅ VM and container should be ready now`);
          return;
        }

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
    // Map ports to bind on all interfaces (0.0.0.0) for public access
    const portMappings = containerConfig.ports
      .map((p) => `-p 0.0.0.0:${p.container}:${p.container}`)
      .join(' ');

    const envVars = containerConfig.environment
      ? Object.entries(containerConfig.environment)
          .map(([key, value]) => `-e ${key}="${value}"`)
          .join(' ')
      : '';

    // Generate firewall rules for each port
    const firewallRules = containerConfig.ports
      .map((p) => `ufw allow ${p.container}/tcp`)
      .join('\n');

    return `#!/bin/bash
set -e  # Exit on error

# Auron Lab Container Startup Script
exec > >(tee -a /var/log/auron-lab-startup.log)
exec 2>&1

echo "========================================="
echo "Auron Lab Startup Script"
echo "Time: $(date)"
echo "========================================="

# Update system
echo "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  apt-get install -y apt-transport-https ca-certificates curl software-properties-common
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
  add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io
  systemctl enable docker
  systemctl start docker
  echo "Docker installed successfully"
else
  echo "Docker is already installed"
fi

# Wait for Docker to be ready
echo "Waiting for Docker daemon to be ready..."
for i in {1..30}; do
  if docker info > /dev/null 2>&1; then
    echo "Docker is ready!"
    break
  fi
  echo "Waiting for Docker... (attempt $i/30)"
  sleep 2
done

# Configure firewall (UFW)
echo "Configuring firewall..."
apt-get install -y ufw
ufw --force enable
ufw allow 22/tcp  # SSH
${firewallRules}
ufw reload
echo "Firewall configured successfully"

# Pull and run container
echo "Pulling Docker image: ${containerConfig.image}"
docker pull ${containerConfig.image}

# Stop and remove existing container if it exists
if docker ps -a --format '{{.Names}}' | grep -q '^auron-lab$'; then
  echo "Removing existing container..."
  docker stop auron-lab || true
  docker rm auron-lab || true
fi

echo "Starting container..."
docker run -d \\
  --name auron-lab \\
  --restart unless-stopped \\
  ${portMappings} \\
  ${envVars} \\
  ${containerConfig.image}

# Wait for container to be running
sleep 5

# Log status
echo "========================================="
echo "Container Status:"
docker ps -a | grep auron-lab
echo "========================================="
echo "Listening Ports:"
netstat -tlnp | grep -E ':(${containerConfig.ports.map(p => p.container).join('|')})' || echo "No ports listening yet"
echo "========================================="
echo "Container Logs:"
docker logs auron-lab
echo "========================================="
echo "Startup complete!"
echo "Container: ${containerConfig.image}"
echo "Time: $(date)"
echo "========================================="
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
