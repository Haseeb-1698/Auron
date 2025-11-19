import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { CollaborationSession } from './CollaborationSession';

/**
 * CollaborationParticipant attributes
 */
interface CollaborationParticipantAttributes {
  id: string;
  sessionId: string;
  userId: string;
  role: 'host' | 'participant' | 'viewer';
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Attributes required for creating a collaboration participant
 */
interface CollaborationParticipantCreationAttributes
  extends Optional<CollaborationParticipantAttributes, 'id' | 'role' | 'joinedAt' | 'isActive' | 'createdAt' | 'updatedAt'> {}

/**
 * CollaborationParticipant Model
 * Tracks users participating in collaboration sessions
 */
class CollaborationParticipant
  extends Model<CollaborationParticipantAttributes, CollaborationParticipantCreationAttributes>
  implements CollaborationParticipantAttributes
{
  public id!: string;
  public sessionId!: string;
  public userId!: string;
  public role!: 'host' | 'participant' | 'viewer';
  public joinedAt!: Date;
  public leftAt!: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly session?: CollaborationSession;
  public readonly user?: User;
}

CollaborationParticipant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'session_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    role: {
      type: DataTypes.ENUM('host', 'participant', 'viewer'),
      defaultValue: 'participant',
      allowNull: false,
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'joined_at',
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'left_at',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize: sequelize,
    tableName: 'collaboration_participants',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
CollaborationParticipant.belongsTo(CollaborationSession, {
  foreignKey: 'sessionId',
  as: 'session',
});

CollaborationParticipant.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

CollaborationSession.hasMany(CollaborationParticipant, {
  foreignKey: 'sessionId',
  as: 'participants',
});

export { CollaborationParticipant, CollaborationParticipantAttributes, CollaborationParticipantCreationAttributes };
