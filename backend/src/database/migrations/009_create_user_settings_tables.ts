import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create user_settings and user_cloud_settings tables
 * Stores user preferences and encrypted cloud provider API keys
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    // Create user_settings table
    await queryInterface.createTable('user_settings', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who owns these settings',
      },
      lab_default_duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 60,
        comment: 'Default lab duration in minutes',
      },
      lab_auto_shutdown: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
        comment: 'Automatically shutdown labs when time expires',
      },
      notifications_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
        comment: 'Enable push notifications',
      },
      theme: {
        type: DataTypes.ENUM('light', 'dark', 'auto'),
        allowNull: true,
        defaultValue: 'auto',
        comment: 'UI theme preference',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    // Create user_cloud_settings table for encrypted API keys
    await queryInterface.createTable('user_cloud_settings', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
        comment: 'User who owns these cloud settings',
      },
      provider: {
        type: DataTypes.ENUM('vultr', 'aws', 'digitalocean', 'azure', 'gcp'),
        allowNull: false,
        comment: 'Cloud provider name',
      },
      api_key_encrypted: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Encrypted API key (AES-256)',
      },
      region: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Preferred cloud region',
      },
      instance_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Preferred instance type',
      },
      ssh_key: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'SSH public key for instances',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex('user_settings', ['user_id'], {
      name: 'idx_user_settings_user_id',
      unique: true,
    });

    await queryInterface.addIndex('user_cloud_settings', ['user_id'], {
      name: 'idx_user_cloud_settings_user_id',
    });

    await queryInterface.addIndex('user_cloud_settings', ['provider'], {
      name: 'idx_user_cloud_settings_provider',
    });

    // Unique constraint for user_id + provider combination
    await queryInterface.addConstraint('user_cloud_settings', {
      fields: ['user_id', 'provider'],
      type: 'unique',
      name: 'unique_user_provider',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop indexes and constraints
    await queryInterface.removeConstraint('user_cloud_settings', 'unique_user_provider');
    await queryInterface.removeIndex('user_cloud_settings', 'idx_user_cloud_settings_provider');
    await queryInterface.removeIndex('user_cloud_settings', 'idx_user_cloud_settings_user_id');
    await queryInterface.removeIndex('user_settings', 'idx_user_settings_user_id');

    // Drop tables
    await queryInterface.dropTable('user_cloud_settings');
    await queryInterface.dropTable('user_settings');

    // Drop ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_settings_theme"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_cloud_settings_provider"');
  },
};
