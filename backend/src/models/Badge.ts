import { Table, Column, Model, DataType, HasMany, Default } from 'sequelize-typescript';
import { UserBadge } from './UserBadge';

@Table({ tableName: 'badges', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' })
export class Badge extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.TEXT)
  description!: string;

  @Column(DataType.STRING)
  iconUrl?: string;

  @Column(DataType.STRING)
  category!: string; // completion, streak, points, special

  @Column(DataType.STRING)
  requirementType!: string; // labs_completed, points_earned, streak_days, specific_lab

  @Column(DataType.INTEGER)
  requirementValue!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  pointsReward!: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default('common')
  @Column(DataType.STRING)
  rarity!: string; // common, rare, epic, legendary

  @HasMany(() => UserBadge)
  userBadges!: UserBadge[];

  // Timestamps
  createdAt!: Date;
  updatedAt!: Date;
}
