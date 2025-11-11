import { Lab, LabCategory, LabDifficulty } from '@models/Lab';
import { Op } from 'sequelize';

/**
 * Lab Repository
 * Data access layer for Lab operations
 */

export interface LabFilters {
  category?: LabCategory;
  difficulty?: LabDifficulty;
  isActive?: boolean;
  search?: string;
}

export class LabRepository {
  /**
   * Find all labs with optional filters
   */
  async findAll(filters?: LabFilters): Promise<Lab[]> {
    const where: any = {};

    if (filters) {
      if (filters.category) {
        where.category = filters.category;
      }
      if (filters.difficulty) {
        where.difficulty = filters.difficulty;
      }
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      if (filters.search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${filters.search}%` } },
          { description: { [Op.iLike]: `%${filters.search}%` } },
          { tags: { [Op.contains]: [filters.search] } },
        ];
      }
    }

    return await Lab.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find lab by ID
   */
  async findById(id: string): Promise<Lab | null> {
    return await Lab.findByPk(id);
  }

  /**
   * Create a new lab
   */
  async create(labData: Partial<Lab>): Promise<Lab> {
    return await Lab.create(labData as any);
  }

  /**
   * Update a lab
   */
  async update(id: string, labData: Partial<Lab>): Promise<Lab | null> {
    const lab = await this.findById(id);
    if (!lab) {
      return null;
    }

    await lab.update(labData);
    return lab;
  }

  /**
   * Delete a lab
   */
  async delete(id: string): Promise<boolean> {
    const lab = await this.findById(id);
    if (!lab) {
      return false;
    }

    await lab.destroy();
    return true;
  }

  /**
   * Get lab count by category
   */
  async countByCategory(): Promise<Record<LabCategory, number>> {
    const counts = await Lab.findAll({
      attributes: [
        'category',
        [Lab.sequelize!.fn('COUNT', Lab.sequelize!.col('id')), 'count'],
      ],
      where: { isActive: true },
      group: ['category'],
      raw: true,
    });

    const result: Record<string, number> = {};
    for (const item of counts as any[]) {
      result[item.category] = parseInt(item.count, 10);
    }

    return result as Record<LabCategory, number>;
  }

  /**
   * Get lab count by difficulty
   */
  async countByDifficulty(): Promise<Record<LabDifficulty, number>> {
    const counts = await Lab.findAll({
      attributes: [
        'difficulty',
        [Lab.sequelize!.fn('COUNT', Lab.sequelize!.col('id')), 'count'],
      ],
      where: { isActive: true },
      group: ['difficulty'],
      raw: true,
    });

    const result: Record<string, number> = {};
    for (const item of counts as any[]) {
      result[item.difficulty] = parseInt(item.count, 10);
    }

    return result as Record<LabDifficulty, number>;
  }
}

export default new LabRepository();
