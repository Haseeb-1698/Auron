import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@utils/logger';
import { ContainerConfig } from '@models/Lab';

/**
 * Docker Service
 * Manages Docker container lifecycle for lab instances
 * Handles container creation, starting, stopping, and cleanup
 */

export interface ContainerCreateOptions {
  image: string;
  name?: string;
  ports?: Array<{ container: number; host?: number }>;
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  memoryLimit?: string;
  cpuLimit?: string;
  command?: string[];
  labels?: Record<string, string>;
}

export interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  ports: Array<{ container: number; host: number }>;
  ipAddress?: string;
  createdAt: Date;
}

export class DockerService {
  private docker: Docker;
  private readonly CONTAINER_PREFIX = 'auron-lab-';
  private readonly NETWORK_NAME = 'auron-labs-network';
  private readonly MAX_RETRIES = 3;
  private readonly CLEANUP_TIMEOUT = 10000; // 10 seconds

  constructor() {
    const dockerHost = process.env.DOCKER_HOST || '/var/run/docker.sock';
    this.docker = new Docker({ socketPath: dockerHost });
  }

  /**
   * Initialize Docker service
   * Creates network if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      await this.ensureNetworkExists();
      logger.info('Docker service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Docker service:', error);
      throw error;
    }
  }

  /**
   * Ensure lab network exists
   */
  private async ensureNetworkExists(): Promise<void> {
    try {
      const networks = await this.docker.listNetworks({
        filters: { name: [this.NETWORK_NAME] },
      });

      if (networks.length === 0) {
        await this.docker.createNetwork({
          Name: this.NETWORK_NAME,
          Driver: 'bridge',
          Internal: false,
          Attachable: true,
          Labels: {
            'auron.type': 'lab-network',
          },
        });
        logger.info(`Created network: ${this.NETWORK_NAME}`);
      }
    } catch (error) {
      logger.error('Error ensuring network exists:', error);
      throw error;
    }
  }

  /**
   * Create and start a container
   */
  async createContainer(
    config: ContainerConfig,
    userId: string,
    labId: string
  ): Promise<ContainerInfo> {
    const containerName = `${this.CONTAINER_PREFIX}${userId.substring(0, 8)}-${labId.substring(0, 8)}-${uuidv4().substring(0, 8)}`;

    try {
      // Pull image if not exists
      await this.ensureImageExists(config.image);

      // Prepare port bindings
      const portBindings: Record<string, Array<{ HostPort: string }>> = {};
      const exposedPorts: Record<string, object> = {};

      if (config.ports) {
        for (const portMapping of config.ports) {
          const containerPort = `${portMapping.container}/tcp`;
          const hostPort = portMapping.host || await this.findAvailablePort();

          exposedPorts[containerPort] = {};
          portBindings[containerPort] = [{ HostPort: hostPort.toString() }];
        }
      }

      // Prepare environment variables
      const env: string[] = [];
      if (config.environment) {
        for (const [key, value] of Object.entries(config.environment)) {
          env.push(`${key}=${value}`);
        }
      }

      // Prepare host config
      const hostConfig: Docker.HostConfig = {
        PortBindings: portBindings,
        AutoRemove: false,
        RestartPolicy: { Name: 'unless-stopped' },
      };

      // Add resource limits
      if (config.memoryLimit) {
        hostConfig.Memory = this.parseMemoryLimit(config.memoryLimit);
      }
      if (config.cpuLimit) {
        hostConfig.NanoCpus = this.parseCpuLimit(config.cpuLimit);
      }

      // Add volumes
      if (config.volumes && config.volumes.length > 0) {
        hostConfig.Binds = config.volumes;
      }

      // Create container
      const container = await this.docker.createContainer({
        name: containerName,
        Image: config.image,
        Env: env,
        ExposedPorts: exposedPorts,
        HostConfig: hostConfig,
        Cmd: config.command,
        Labels: {
          'auron.type': 'lab-instance',
          'auron.user-id': userId,
          'auron.lab-id': labId,
          'auron.created-at': new Date().toISOString(),
        },
        NetworkingConfig: {
          EndpointsConfig: {
            [this.NETWORK_NAME]: {},
          },
        },
      });

      // Start container
      await container.start();

      // Get container info
      const containerInfo = await this.getContainerInfo(container.id);

      logger.info(`Container created and started: ${containerName}`);
      return containerInfo;
    } catch (error) {
      logger.error(`Failed to create container ${containerName}:`, error);
      throw new Error(`Failed to create lab container: ${(error as Error).message}`);
    }
  }

  /**
   * Ensure Docker image exists, pull if necessary
   */
  private async ensureImageExists(imageName: string): Promise<void> {
    try {
      const images = await this.docker.listImages({
        filters: { reference: [imageName] },
      });

      if (images.length === 0) {
        logger.info(`Pulling image: ${imageName}`);
        await new Promise((resolve, reject) => {
          this.docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);

            this.docker.modem.followProgress(
              stream,
              (err: Error | null, output: unknown[]) => {
                if (err) return reject(err);
                resolve(output);
              },
              (event: { status: string }) => {
                logger.debug(`Pull progress: ${event.status}`);
              }
            );
          });
        });
        logger.info(`Image pulled successfully: ${imageName}`);
      }
    } catch (error) {
      logger.error(`Failed to pull image ${imageName}:`, error);
      throw error;
    }
  }

  /**
   * Get container information
   */
  async getContainerInfo(containerId: string): Promise<ContainerInfo> {
    try {
      const container = this.docker.getContainer(containerId);
      const data = await container.inspect();

      const ports: Array<{ container: number; host: number }> = [];
      if (data.NetworkSettings?.Ports) {
        for (const [containerPort, hostPorts] of Object.entries(data.NetworkSettings.Ports)) {
          if (hostPorts && hostPorts.length > 0) {
            const port = parseInt(containerPort.split('/')[0], 10);
            const hostPort = parseInt(hostPorts[0].HostPort, 10);
            ports.push({ container: port, host: hostPort });
          }
        }
      }

      return {
        id: data.Id,
        name: data.Name.replace(/^\//, ''),
        status: data.State.Status,
        ports,
        ipAddress: data.NetworkSettings?.Networks?.[this.NETWORK_NAME]?.IPAddress,
        createdAt: new Date(data.Created),
      };
    } catch (error) {
      logger.error(`Failed to get container info for ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Stop a container
   */
  async stopContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop({ t: 10 }); // 10 second timeout
      logger.info(`Container stopped: ${containerId}`);
    } catch (error) {
      if ((error as {statusCode?: number}).statusCode === 304) {
        // Container already stopped
        logger.debug(`Container already stopped: ${containerId}`);
        return;
      }
      logger.error(`Failed to stop container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Start a stopped container
   */
  async startContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.start();
      logger.info(`Container started: ${containerId}`);
    } catch (error) {
      if ((error as {statusCode?: number}).statusCode === 304) {
        // Container already running
        logger.debug(`Container already running: ${containerId}`);
        return;
      }
      logger.error(`Failed to start container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Restart a container
   */
  async restartContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.restart({ t: 10 });
      logger.info(`Container restarted: ${containerId}`);
    } catch (error) {
      logger.error(`Failed to restart container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a container
   */
  async removeContainer(containerId: string, force = false): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.remove({ force, v: true }); // Remove volumes as well
      logger.info(`Container removed: ${containerId}`);
    } catch (error) {
      if ((error as {statusCode?: number}).statusCode === 404) {
        // Container not found
        logger.debug(`Container not found: ${containerId}`);
        return;
      }
      logger.error(`Failed to remove container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(
    containerId: string,
    tail = 100
  ): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true,
      });
      return logs.toString();
    } catch (error) {
      logger.error(`Failed to get logs for container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * Get container stats
   */
  async getContainerStats(containerId: string): Promise<Docker.ContainerStats> {
    try {
      const container = this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      return stats;
    } catch (error) {
      logger.error(`Failed to get stats for container ${containerId}:`, error);
      throw error;
    }
  }

  /**
   * List all lab containers
   */
  async listLabContainers(userId?: string): Promise<ContainerInfo[]> {
    try {
      const filters: { label?: string[] } = {
        label: ['auron.type=lab-instance'],
      };

      if (userId) {
        filters.label!.push(`auron.user-id=${userId}`);
      }

      const containers = await this.docker.listContainers({
        all: true,
        filters,
      });

      const containerInfos: ContainerInfo[] = [];
      for (const container of containers) {
        try {
          const info = await this.getContainerInfo(container.Id);
          containerInfos.push(info);
        } catch (error) {
          logger.warn(`Failed to get info for container ${container.Id}:`, error);
        }
      }

      return containerInfos;
    } catch (error) {
      logger.error('Failed to list lab containers:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired containers
   */
  async cleanupExpiredContainers(): Promise<number> {
    try {
      const containers = await this.listLabContainers();
      let cleanedCount = 0;

      for (const container of containers) {
        try {
          const createdDate = container.createdAt;
          const now = new Date();
          const ageInHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

          // Remove containers older than 24 hours
          if (ageInHours > 24) {
            await this.removeContainer(container.id, true);
            cleanedCount++;
            logger.info(`Cleaned up expired container: ${container.name}`);
          }
        } catch (error) {
          logger.warn(`Failed to cleanup container ${container.id}:`, error);
        }
      }

      logger.info(`Cleaned up ${cleanedCount} expired containers`);
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired containers:', error);
      throw error;
    }
  }

  /**
   * Find an available port on the host
   */
  private async findAvailablePort(start = 10000, end = 60000): Promise<number> {
    const usedPorts = new Set<number>();

    // Get all container port mappings
    const containers = await this.docker.listContainers({ all: true });
    for (const container of containers) {
      if (container.Ports) {
        for (const port of container.Ports) {
          if (port.PublicPort) {
            usedPorts.add(port.PublicPort);
          }
        }
      }
    }

    // Find first available port
    for (let port = start; port <= end; port++) {
      if (!usedPorts.has(port)) {
        return port;
      }
    }

    throw new Error('No available ports found');
  }

  /**
   * Parse memory limit string to bytes
   */
  private parseMemoryLimit(limit: string): number {
    const units: Record<string, number> = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024,
    };

    const match = limit.toLowerCase().match(/^(\d+)([bkmg]?)$/);
    if (!match) {
      throw new Error(`Invalid memory limit format: ${limit}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || 'b';
    return value * units[unit];
  }

  /**
   * Parse CPU limit string to nano CPUs
   */
  private parseCpuLimit(limit: string): number {
    const value = parseFloat(limit);
    if (isNaN(value) || value <= 0) {
      throw new Error(`Invalid CPU limit: ${limit}`);
    }
    return Math.floor(value * 1e9); // Convert to nano CPUs
  }

  /**
   * Health check for Docker daemon
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      logger.error('Docker health check failed:', error);
      return false;
    }
  }
}

export default new DockerService();
