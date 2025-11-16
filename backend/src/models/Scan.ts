import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull,
} from 'sequelize-typescript';
import { User } from './User';
import { Lab } from './Lab';
import { LabInstance } from './LabInstance';

/**
 * Scan Model
 * Represents vulnerability scans performed on lab instances
 */

export enum ScanStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ScanType {
  QUICK = 'quick',
  FULL = 'full',
  CUSTOM = 'custom',
}

export interface ScanResult {
  vulnerabilities: Vulnerability[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  duration: number;
  timestamp: string;
}

export interface Vulnerability {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  cvss?: number;
  cwe?: string;
  cve?: string;
  solution?: string;
  references?: string[];
  evidence?: string;
  location?: string;
}

@Table({
  tableName: 'scans',
  timestamps: true,
})
export class Scan extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @ForeignKey(() => Lab)
  @AllowNull(false)
  @Column(DataType.UUID)
  labId!: string;

  @ForeignKey(() => LabInstance)
  @AllowNull(true)
  @Column(DataType.UUID)
  instanceId?: string;

  @Default(ScanType.QUICK)
  @Column(DataType.ENUM(...Object.values(ScanType)))
  scanType!: ScanType;

  @Default(ScanStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ScanStatus)))
  status!: ScanStatus;

  @Column(DataType.STRING)
  targetUrl?: string;

  @Default(0)
  @Column(DataType.INTEGER)
  progress!: number; // 0-100

  @Column(DataType.JSONB)
  results?: ScanResult;

  @Column(DataType.TEXT)
  errorMessage?: string;

  @Column(DataType.DATE)
  startedAt?: Date;

  @Column(DataType.DATE)
  completedAt?: Date;

  @Default({})
  @Column(DataType.JSONB)
  configuration?: Record<string, unknown>;

  // Associations
  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Lab)
  lab!: Lab;

  @BelongsTo(() => LabInstance)
  instance?: LabInstance;
}

export default Scan;
