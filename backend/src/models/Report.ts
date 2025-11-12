import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { User } from './User';
import { Lab } from './Lab';

/**
 * Report Type Enum
 */
export enum ReportType {
  LAB_COMPLETION = 'lab_completion',
  VULNERABILITY_SCAN = 'vulnerability_scan',
  PROGRESS_SUMMARY = 'progress_summary',
  CUSTOM = 'custom',
}

/**
 * Report Format Enum
 */
export enum ReportFormat {
  PDF = 'pdf',
  JSON = 'json',
  CSV = 'csv',
  HTML = 'html',
}

/**
 * Report Status Enum
 */
export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Report Data Interface
 */
export interface ReportData {
  [key: string]: unknown;
  summary?: Record<string, unknown>;
  labs?: unknown[];
  scans?: unknown[];
  vulnerabilities?: unknown[];
  charts?: unknown[];
}

/**
 * Report Model
 * Stores generated reports for users
 */
@Table({ tableName: 'reports', timestamps: true })
export class Report extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId!: string;

  @BelongsTo(() => User)
  user?: User;

  @ForeignKey(() => Lab)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  labId?: string;

  @BelongsTo(() => Lab)
  lab?: Lab;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Default(ReportType.LAB_COMPLETION)
  @Column({
    type: DataType.ENUM(...Object.values(ReportType)),
    allowNull: false,
  })
  reportType!: ReportType;

  @Default(ReportFormat.PDF)
  @Column({
    type: DataType.ENUM(...Object.values(ReportFormat)),
    allowNull: false,
  })
  format!: ReportFormat;

  @Default(ReportStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(ReportStatus)),
    allowNull: false,
  })
  status!: ReportStatus;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  data?: ReportData;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  filePath?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  fileName?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'File size in bytes',
  })
  fileSize?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  generatedAt?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  errorMessage?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When this report expires and can be deleted',
  })
  expiresAt?: Date;
}
