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
 * LabInstance Model
 * Represents running Docker container instances for labs
 */

export enum LabInstanceStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
  EXPIRED = 'expired',
}

@Table({
  tableName: 'lab_instances',
  timestamps: true,
})
export class LabInstance extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Lab)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  labId!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  userId!: string;

  // Cloud VM Instance ID (Vultr)
  @AllowNull(false)
  @Index
  @Column(DataType.STRING)
  cloudInstanceId!: string;

  // Public IP address of the VM
  @Column(DataType.STRING)
  publicIp?: string;

  // Internal/Private IP
  @Column(DataType.STRING)
  internalIp?: string;

  // Cloud provider (vultr, aws, gcp, etc.)
  @Default('vultr')
  @Column(DataType.STRING)
  cloudProvider!: string;

  // Docker container ID on the VM
  @Column(DataType.STRING)
  containerId?: string;

  @Column(DataType.STRING)
  containerName?: string;

  @Default(LabInstanceStatus.STARTING)
  @Column(DataType.ENUM(...Object.values(LabInstanceStatus)))
  status!: LabInstanceStatus;

  @Column(DataType.STRING)
  accessUrl?: string;

  @Default([])
  @Column(DataType.JSONB)
  ports!: Array<{ container: number; host: number }>;

  // Cloud instance info (region, plan, etc.)
  @Column(DataType.JSONB)
  cloudInstanceInfo?: Record<string, unknown>;

  @Column(DataType.JSONB)
  containerInfo?: Record<string, unknown>;

  @Column(DataType.DATE)
  startedAt?: Date;

  @Column(DataType.DATE)
  stoppedAt?: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  expiresAt!: Date;

  @Column(DataType.TEXT)
  errorMessage?: string;

  @Default(0)
  @Column(DataType.INTEGER)
  restartCount!: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  autoCleanup!: boolean;

  // Associations
  @BelongsTo(() => Lab)
  lab!: Lab;

  @BelongsTo(() => User)
  user!: User;

  // Instance methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isRunning(): boolean {
    return this.status === LabInstanceStatus.RUNNING;
  }

  canBeRestarted(): boolean {
    return (
      this.status === LabInstanceStatus.STOPPED ||
      this.status === LabInstanceStatus.ERROR ||
      this.status === LabInstanceStatus.EXPIRED
    );
  }
}

export default LabInstance;
