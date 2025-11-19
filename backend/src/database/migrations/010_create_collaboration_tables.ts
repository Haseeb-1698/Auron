import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create Collaboration Tables
 * Creates tables for collaboration sessions and participants
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create collaboration_sessions table
  await queryInterface.createTable('collaboration_sessions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    host_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    lab_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'labs',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    status: {
      type: DataTypes.ENUM('active', 'ended', 'scheduled'),
      defaultValue: 'active',
      allowNull: false,
    },
    screen_sharing_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    screen_sharing_stream_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    max_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      allowNull: false,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create collaboration_participants table
  await queryInterface.createTable('collaboration_participants', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'collaboration_sessions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('host', 'participant', 'viewer'),
      defaultValue: 'participant',
      allowNull: false,
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add indexes for performance
  await queryInterface.addIndex('collaboration_sessions', ['host_id'], {
    name: 'idx_collab_sessions_host_id',
  });

  await queryInterface.addIndex('collaboration_sessions', ['lab_id'], {
    name: 'idx_collab_sessions_lab_id',
  });

  await queryInterface.addIndex('collaboration_sessions', ['status'], {
    name: 'idx_collab_sessions_status',
  });

  await queryInterface.addIndex('collaboration_participants', ['session_id'], {
    name: 'idx_collab_participants_session_id',
  });

  await queryInterface.addIndex('collaboration_participants', ['user_id'], {
    name: 'idx_collab_participants_user_id',
  });

  await queryInterface.addIndex('collaboration_participants', ['session_id', 'user_id'], {
    name: 'idx_collab_participants_session_user',
    unique: false, // Allow multiple entries for rejoining
  });

  await queryInterface.addIndex('collaboration_participants', ['is_active'], {
    name: 'idx_collab_participants_is_active',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove indexes
  await queryInterface.removeIndex('collaboration_participants', 'idx_collab_participants_is_active');
  await queryInterface.removeIndex('collaboration_participants', 'idx_collab_participants_session_user');
  await queryInterface.removeIndex('collaboration_participants', 'idx_collab_participants_user_id');
  await queryInterface.removeIndex('collaboration_participants', 'idx_collab_participants_session_id');
  await queryInterface.removeIndex('collaboration_sessions', 'idx_collab_sessions_status');
  await queryInterface.removeIndex('collaboration_sessions', 'idx_collab_sessions_lab_id');
  await queryInterface.removeIndex('collaboration_sessions', 'idx_collab_sessions_host_id');

  // Drop tables
  await queryInterface.dropTable('collaboration_participants');
  await queryInterface.dropTable('collaboration_sessions');
}
