import { Model, DataTypes, Optional } from 'sequelize';
import { db } from '../database';
import { User } from './User';
import { Lab } from './Lab';

/**
 * CollaborationSession attributes
 */
interface CollaborationSessionAttributes {
  id: string;
  name: string;
  hostId: string;
  labId?: string;
  status: 'active' | 'ended' | 'scheduled';
  screenSharingUserId?: string;
  screenSharingStreamId?: string;
  maxParticipants: number;
  startedAt: Date;
  endedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Attributes required for creating a collaboration session
 */
interface CollaborationSessionCreationAttributes
  extends Optional<CollaborationSessionAttributes, 'id' | 'status' | 'maxParticipants' | 'startedAt' | 'createdAt' | 'updatedAt'> {}

/**
 * CollaborationSession Model
 * Manages real-time collaboration sessions between users
 */
class CollaborationSession
  extends Model<CollaborationSessionAttributes, CollaborationSessionCreationAttributes>
  implements CollaborationSessionAttributes
{
  public id!: string;
  public name!: string;
  public hostId!: string;
  public labId!: string;
  public status!: 'active' | 'ended' | 'scheduled';
  public screenSharingUserId!: string;
  public screenSharingStreamId!: string;
  public maxParticipants!: number;
  public startedAt!: Date;
  public endedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly host?: User;
  public readonly lab?: Lab;
  public readonly participants?: any[];
}

CollaborationSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    hostId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'host_id',
    },
    labId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'lab_id',
    },
    status: {
      type: DataTypes.ENUM('active', 'ended', 'scheduled'),
      defaultValue: 'active',
      allowNull: false,
    },
    screenSharingUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'screen_sharing_user_id',
    },
    screenSharingStreamId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'screen_sharing_stream_id',
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      allowNull: false,
      field: 'max_participants',
      validate: {
        min: 2,
        max: 50,
      },
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'started_at',
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ended_at',
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
    sequelize: db,
    tableName: 'collaboration_sessions',
    timestamps: true,
    underscored: true,
  }
);

// Define associations
CollaborationSession.belongsTo(User, {
  foreignKey: 'hostId',
  as: 'host',
});

CollaborationSession.belongsTo(Lab, {
  foreignKey: 'labId',
  as: 'lab',
});

export { CollaborationSession, CollaborationSessionAttributes, CollaborationSessionCreationAttributes };
