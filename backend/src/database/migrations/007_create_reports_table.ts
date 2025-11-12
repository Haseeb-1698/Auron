import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('reports', {
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
      allowNull: true,
      references: {
        model: 'labs',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    report_type: {
      type: DataTypes.ENUM('lab_completion', 'vulnerability_scan', 'progress_summary', 'custom'),
      allowNull: false,
      defaultValue: 'lab_completion',
      comment: 'Type of report being generated',
    },
    format: {
      type: DataTypes.ENUM('pdf', 'json', 'csv', 'html'),
      allowNull: false,
      defaultValue: 'pdf',
      comment: 'Export format for the report',
    },
    status: {
      type: DataTypes.ENUM('pending', 'generating', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Current status of report generation',
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Report data in JSON format',
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Path to generated report file',
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Generated file name',
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'File size in bytes',
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the report was successfully generated',
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if generation failed',
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this report expires and can be deleted',
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
  await queryInterface.addIndex('reports', ['user_id']);
  await queryInterface.addIndex('reports', ['lab_id']);
  await queryInterface.addIndex('reports', ['status']);
  await queryInterface.addIndex('reports', ['report_type']);
  await queryInterface.addIndex('reports', ['created_at']);
  await queryInterface.addIndex('reports', ['expires_at']);
  await queryInterface.addIndex('reports', ['user_id', 'status']);
  await queryInterface.addIndex('reports', ['user_id', 'report_type']);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('reports');
};
