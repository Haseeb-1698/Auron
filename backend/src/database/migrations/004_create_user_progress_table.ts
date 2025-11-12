import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('user_progress', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    lab_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'labs',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      defaultValue: 'not_started',
    },
    progress_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '0-100',
    },
    completed_exercises: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Array of completed exercise IDs',
    },
    hints_used: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    time_spent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Time spent in seconds',
    },
    points_earned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Final score out of 100',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User notes',
    },
    flagged_vulnerabilities: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Vulnerabilities found by user',
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_accessed_at: {
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

  // Create indexes
  await queryInterface.addIndex('user_progress', ['user_id']);
  await queryInterface.addIndex('user_progress', ['lab_id']);
  await queryInterface.addIndex('user_progress', ['status']);
  await queryInterface.addIndex('user_progress', ['user_id', 'lab_id'], {
    unique: true,
    name: 'user_progress_user_lab_unique',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('user_progress');
};
