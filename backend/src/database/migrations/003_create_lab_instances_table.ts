import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Create enum type
  await queryInterface.sequelize.query(`
    CREATE TYPE lab_instance_status AS ENUM (
      'starting',
      'running',
      'stopping',
      'stopped',
      'error'
    );
  `);

  await queryInterface.createTable('lab_instances', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
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
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    // Cloud VM Information
    cloud_instance_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Vultr VM ID',
    },
    public_ip: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'VM public IP address',
    },
    internal_ip: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'VM internal IP address',
    },
    cloud_provider: {
      type: DataTypes.STRING,
      defaultValue: 'vultr',
      comment: 'Cloud provider name',
    },
    cloud_instance_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Region, plan, specs',
    },
    // Container Information (running on VM)
    container_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    container_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Instance Status
    status: {
      type: DataTypes.ENUM('starting', 'running', 'stopping', 'stopped', 'error'),
      defaultValue: 'starting',
    },
    access_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'http://public_ip:port',
    },
    ports: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    container_info: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    stopped_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    restart_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    auto_cleanup: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
  await queryInterface.addIndex('lab_instances', ['user_id']);
  await queryInterface.addIndex('lab_instances', ['lab_id']);
  await queryInterface.addIndex('lab_instances', ['cloud_instance_id']);
  await queryInterface.addIndex('lab_instances', ['status']);
  await queryInterface.addIndex('lab_instances', ['expires_at']);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('lab_instances');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS lab_instance_status;');
};
