import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('scans', {
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
    instance_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'lab_instances',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    scan_type: {
      type: DataTypes.ENUM('quick', 'full', 'custom'),
      allowNull: false,
      defaultValue: 'quick',
      comment: 'Type of vulnerability scan',
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Current status of the scan',
    },
    target_url: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'URL of the target being scanned',
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the scan execution started',
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the scan finished',
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Scan duration in milliseconds',
    },
    vulnerabilities_found: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of vulnerabilities detected',
    },
    results: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Detailed scan results with vulnerabilities',
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if scan failed',
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

  // Create indexes for efficient querying
  await queryInterface.addIndex('scans', ['user_id']);
  await queryInterface.addIndex('scans', ['lab_id']);
  await queryInterface.addIndex('scans', ['instance_id']);
  await queryInterface.addIndex('scans', ['status']);
  await queryInterface.addIndex('scans', ['scan_type']);
  await queryInterface.addIndex('scans', ['created_at']);
  await queryInterface.addIndex('scans', ['user_id', 'status']);
  await queryInterface.addIndex('scans', ['lab_id', 'status']);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('scans');
};
