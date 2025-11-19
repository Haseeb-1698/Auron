import {
  Table,
  Column,
  Model,
  DataType,
  Unique,
  AllowNull,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { LabInstance } from './LabInstance';
import { UserProgress } from './UserProgress';

/**
 * User Model
 * Represents application users with authentication and profile data
 */

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare username: string;

  @Column(DataType.STRING)
  displayName?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare passwordHash: string;

  @Column(DataType.STRING)
  firstName?: string;

  @Column(DataType.STRING)
  lastName?: string;

  @Column(DataType.STRING)
  avatar?: string;

  @Column(DataType.TEXT)
  bio?: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isVerified: boolean;

  @Default(UserRole.STUDENT)
  @Column(DataType.ENUM(...Object.values(UserRole)))
  declare role: UserRole;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare twoFactorEnabled: boolean;

  @Column(DataType.STRING)
  twoFactorSecret?: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @Column(DataType.DATE)
  lastLoginAt?: Date;

  // Associations
  @HasMany(() => LabInstance)
  declare labInstances: LabInstance[];

  @HasMany(() => UserProgress)
  declare progress: UserProgress[];

  // Computed properties
  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
  }

  get avatarUrl(): string | undefined {
    return this.avatar;
  }

  get password(): string {
    return this.passwordHash;
  }

  // Instance methods
  toJSON(): Partial<User> {
    const values = { ...this.get() };
    delete values.passwordHash;
    delete values.twoFactorSecret;
    return values;
  }
}

export default User;
