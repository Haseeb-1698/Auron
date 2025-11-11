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
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  email!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  username!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  passwordHash!: string;

  @Column(DataType.STRING)
  firstName?: string;

  @Column(DataType.STRING)
  lastName?: string;

  @Column(DataType.STRING)
  avatar?: string;

  @Default(UserRole.STUDENT)
  @Column(DataType.ENUM(...Object.values(UserRole)))
  role!: UserRole;

  @Default(false)
  @Column(DataType.BOOLEAN)
  twoFactorEnabled!: boolean;

  @Column(DataType.STRING)
  twoFactorSecret?: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Column(DataType.DATE)
  lastLoginAt?: Date;

  // Associations
  @HasMany(() => LabInstance)
  labInstances!: LabInstance[];

  @HasMany(() => UserProgress)
  progress!: UserProgress[];

  // Instance methods
  toJSON(): Partial<User> {
    const values = { ...this.get() };
    delete values.passwordHash;
    delete values.twoFactorSecret;
    return values;
  }
}

export default User;
