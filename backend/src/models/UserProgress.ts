import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  Default,
  ForeignKey,
  BelongsTo,
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
  declare id: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare userId: string;

  @ForeignKey(() => Lab)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare labId: string;

  @Column(DataType.STRING)
  exerciseId?: string;

  @Default(ProgressStatus.NOT_STARTED)
  @Column(DataType.ENUM(...Object.values(ProgressStatus)))
  declare status: ProgressStatus;

  @Default(0)
  @Column(DataType.INTEGER)
  declare score: number;

  @Default(0)
  @Column(DataType.INTEGER)
  declare pointsEarned: number;

  @Default([])
  @Column(DataType.JSONB)
  declare completedExercises: string[];

  @Column(DataType.DATE)
  startedAt?: Date;

  @Column(DataType.DATE)
  completedAt?: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  declare timeSpent: number; // in seconds

  @Default(0)
  @Column(DataType.INTEGER)
  declare hintsUsed: number;

  @Default(0)
  @Column(DataType.INTEGER)
  declare attempts: number;

  @Column(DataType.DATE)
  lastActivityAt?: Date;

  @Default([])
  @Column(DataType.JSONB)
  declare unlockedHints: string[];

  @Default({})
  @Column(DataType.JSONB)
  metadata?: Record<string, unknown>;

  // Associations
  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Lab)
  declare lab: Lab;
}

export default UserProgress;
