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
  @Column(DataType.UUID)
  declare labId: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare userId: string;

  // Cloud VM Instance ID (Vultr) - optional for local Docker labs
  @Column(DataType.STRING)
  declare cloudInstanceId?: string;

  // Public IP address of the VM
  @Column(DataType.STRING)
  declare publicIp?: string;

  // Internal/Private IP
  @Column(DataType.STRING)
  declare internalIp?: string;

  // Cloud provider (vultr, aws, gcp, etc.)
  @Default('vultr')
  @Column(DataType.STRING)
  declare cloudProvider: string;

  // Docker container ID on the VM
  @Column(DataType.STRING)
  declare containerId?: string;

  @Column(DataType.STRING)
  declare containerName?: string;

  @Default(LabInstanceStatus.STARTING)
  @Column(DataType.ENUM(...Object.values(LabInstanceStatus)))
  declare status: LabInstanceStatus;

  @Column(DataType.STRING)
  declare accessUrl?: string;

  @Default([])
  @Column(DataType.JSONB)
  declare ports: Array<{ container: number; host: number }>;

  // Cloud instance info (region, plan, etc.)
  @Column(DataType.JSONB)
  declare cloudInstanceInfo?: Record<string, unknown>;

  @Column(DataType.JSONB)
  declare containerInfo?: Record<string, unknown>;

  @Column(DataType.DATE)
  declare startedAt?: Date;

  @Column(DataType.DATE)
  declare stoppedAt?: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare expiresAt: Date;

  @Column(DataType.TEXT)
  declare errorMessage?: string;

  @Default(0)
  @Column(DataType.INTEGER)
  declare restartCount: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare autoCleanup: boolean;

  // Associations
  @BelongsTo(() => Lab)
  declare lab: Lab;

  @BelongsTo(() => User)
  declare user: User;

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
