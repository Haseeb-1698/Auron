import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { LabInstance } from './LabInstance';

/**
 * Lab Model
 * Represents available cybersecurity labs with configurations
 */

export enum LabCategory {
  WEB_SECURITY = 'web_security',
  NETWORK_SECURITY = 'network_security',
  CRYPTOGRAPHY = 'cryptography',
  EXPLOITATION = 'exploitation',
  DEFENSIVE = 'defensive',
  FORENSICS = 'forensics',
}

export enum LabDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export interface ContainerConfig {
  image: string;
  ports: Array<{ container: number; host?: number }>;
  environment?: Record<string, string>;
  volumes?: string[];
  networks?: string[];
  memoryLimit?: string;
  cpuLimit?: string;
  command?: string[];
}

@Table({
  tableName: 'labs',
  timestamps: true,
})
export class Lab extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  description!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(LabCategory)))
  category!: LabCategory;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(LabDifficulty)))
  difficulty!: LabDifficulty;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  estimatedTime!: number; // in minutes

  @Default(100)
  @Column(DataType.INTEGER)
  points!: number;

  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  tags!: string[];

  @Column(DataType.STRING)
  imageUrl?: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  containerConfig!: ContainerConfig;

  @Default([])
  @Column(DataType.JSONB)
  exercises!: Array<{
    id: string;
    title: string;
    description: string;
    instructions: string;
    hints: Array<{ id: string; content: string; cost: number }>;
    points: number;
    order: number;
  }>;

  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  prerequisites!: string[];

  @Default([])
  @Column(DataType.ARRAY(DataType.STRING))
  learningObjectives!: string[];

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default(3600000) // 1 hour in milliseconds
  @Column(DataType.INTEGER)
  timeoutDuration!: number;

  @Default(5)
  @Column(DataType.INTEGER)
  maxInstancesPerUser!: number;

  // Associations
  @HasMany(() => LabInstance)
  instances!: LabInstance[];
}

export default Lab;
