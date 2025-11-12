import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import { User } from './User';
import { Badge } from './Badge';

@Table({ tableName: 'user_badges', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' })
export class UserBadge extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId!: string;

  @ForeignKey(() => Badge)
  @Column(DataType.UUID)
  badgeId!: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  earnedAt!: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  progress!: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isUnlocked!: boolean;

  // Relations
  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Badge)
  badge!: Badge;

  // Timestamps
  declare createdAt: Date;
  declare updatedAt: Date;
}
