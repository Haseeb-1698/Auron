import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  Default,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { User } from './User';
import { Lab } from './Lab';

/**
 * UserProgress Model
 * Tracks user progress through labs and exercises
 */

export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Table({
  tableName: 'user_progress',
  timestamps: true,
})
export class UserProgress extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  userId!: string;

  @ForeignKey(() => Lab)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  labId!: string;

  @Column(DataType.STRING)
  exerciseId?: string;

  @Default(ProgressStatus.NOT_STARTED)
  @Column(DataType.ENUM(...Object.values(ProgressStatus)))
  status!: ProgressStatus;

  @Default(0)
  @Column(DataType.INTEGER)
  score!: number;

  @Column(DataType.DATE)
  completedAt?: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  timeSpent!: number; // in seconds

  @Default(0)
  @Column(DataType.INTEGER)
  hintsUsed!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  attempts!: number;

  @Column(DataType.DATE)
  lastActivityAt?: Date;

  @Default([])
  @Column(DataType.JSONB)
  unlockedHints!: string[];

  @Default({})
  @Column(DataType.JSONB)
  metadata?: Record<string, unknown>;

  // Associations
  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Lab)
  lab!: Lab;
}

export default UserProgress;
