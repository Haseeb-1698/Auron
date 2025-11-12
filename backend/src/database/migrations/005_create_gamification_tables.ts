import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Create badges table
  await queryInterface.createTable('badges', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    icon_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'completion, streak, points, special',
    },
    requirement_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'labs_completed, points_earned, streak_days, specific_lab',
    },
    requirement_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    points_reward: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    rarity: {
      type: DataTypes.STRING,
      defaultValue: 'common',
      comment: 'common, rare, epic, legendary',
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

  // Create user_badges table
  await queryInterface.createTable('user_badges', {
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
    badge_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'badges',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    earned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Progress towards earning this badge (0-100)',
    },
    is_unlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
  await queryInterface.addIndex('badges', ['category']);
  await queryInterface.addIndex('badges', ['is_active']);
  await queryInterface.addIndex('user_badges', ['user_id']);
  await queryInterface.addIndex('user_badges', ['badge_id']);
  await queryInterface.addIndex('user_badges', ['user_id', 'badge_id'], {
    unique: true,
    name: 'user_badges_user_badge_unique',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('user_badges');
  await queryInterface.dropTable('badges');
};
