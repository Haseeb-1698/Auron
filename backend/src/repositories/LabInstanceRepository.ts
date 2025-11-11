import { LabInstance, LabInstanceStatus } from '@models/LabInstance';
import { Lab } from '@models/Lab';
import { User } from '@models/User';
import { Op } from 'sequelize';

/**
 * LabInstance Repository
 * Data access layer for LabInstance operations
 */

export interface LabInstanceFilters {
  userId?: string;
  labId?: string;
  status?: LabInstanceStatus;
  isExpired?: boolean;
}

export class LabInstanceRepository {
  /**
   * Find all lab instances with optional filters
   */
  async findAll(filters?: LabInstanceFilters): Promise<LabInstance[]> {
    const where: any = {};

    if (filters) {
      if (filters.userId) {
        where.userId = filters.userId;
      }
      if (filters.labId) {
        where.labId = filters.labId;
      }
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.isExpired !== undefined) {
        if (filters.isExpired) {
          where.expiresAt = { [Op.lt]: new Date() };
        } else {
          where.expiresAt = { [Op.gte]: new Date() };
        }
      }
    }

    return await LabInstance.findAll({
      where,
      include: [
        { model: Lab, as: 'lab' },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find lab instance by ID
   */
  async findById(id: string): Promise<LabInstance | null> {
    return await LabInstance.findByPk(id, {
      include: [
        { model: Lab, as: 'lab' },
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      ],
    });
  }

  /**
   * Find lab instance by container ID
   */
  async findByContainerId(containerId: string): Promise<LabInstance | null> {
    return await LabInstance.findOne({
      where: { containerId },
      include: [{ model: Lab, as: 'lab' }],
    });
  }

  /**
   * Get user's active instances for a specific lab
   */
  async findActiveByUserAndLab(userId: string, labId: string): Promise<LabInstance[]> {
    return await LabInstance.findAll({
      where: {
        userId,
        labId,
        status: {
          [Op.in]: [LabInstanceStatus.STARTING, LabInstanceStatus.RUNNING],
        },
        expiresAt: { [Op.gte]: new Date() },
      },
      include: [{ model: Lab, as: 'lab' }],
    });
  }

  /**
   * Count user's active instances
   */
  async countActiveByUser(userId: string): Promise<number> {
    return await LabInstance.count({
      where: {
        userId,
        status: {
          [Op.in]: [LabInstanceStatus.STARTING, LabInstanceStatus.RUNNING],
        },
        expiresAt: { [Op.gte]: new Date() },
      },
    });
  }

  /**
   * Create a new lab instance
   */
  async create(instanceData: Partial<LabInstance>): Promise<LabInstance> {
    return await LabInstance.create(instanceData as any);
  }

  /**
   * Update a lab instance
   */
  async update(id: string, instanceData: Partial<LabInstance>): Promise<LabInstance | null> {
    const instance = await this.findById(id);
    if (!instance) {
      return null;
    }

    await instance.update(instanceData);
    return instance;
  }

  /**
   * Update instance by container ID
   */
  async updateByContainerId(
    containerId: string,
    instanceData: Partial<LabInstance>
  ): Promise<LabInstance | null> {
    const instance = await this.findByContainerId(containerId);
    if (!instance) {
      return null;
    }

    await instance.update(instanceData);
    return instance;
  }

  /**
   * Delete a lab instance
   */
  async delete(id: string): Promise<boolean> {
    const instance = await this.findById(id);
    if (!instance) {
      return false;
    }

    await instance.destroy();
    return true;
  }

  /**
   * Find expired instances
   */
  async findExpired(): Promise<LabInstance[]> {
    return await LabInstance.findAll({
      where: {
        expiresAt: { [Op.lt]: new Date() },
        status: {
          [Op.notIn]: [LabInstanceStatus.STOPPED, LabInstanceStatus.ERROR],
        },
      },
      include: [{ model: Lab, as: 'lab' }],
    });
  }

  /**
   * Get user's instance statistics
   */
  async getUserStats(userId: string): Promise<{
    total: number;
    active: number;
    stopped: number;
    expired: number;
  }> {
    const [total, active, stopped, expired] = await Promise.all([
      LabInstance.count({ where: { userId } }),
      LabInstance.count({
        where: {
          userId,
          status: LabInstanceStatus.RUNNING,
          expiresAt: { [Op.gte]: new Date() },
        },
      }),
      LabInstance.count({
        where: { userId, status: LabInstanceStatus.STOPPED },
      }),
      LabInstance.count({
        where: { userId, expiresAt: { [Op.lt]: new Date() } },
      }),
    ]);

    return { total, active, stopped, expired };
  }
}

export default new LabInstanceRepository();
