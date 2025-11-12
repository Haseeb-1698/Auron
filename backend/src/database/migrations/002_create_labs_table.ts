import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Create enum types
  await queryInterface.sequelize.query(`
    CREATE TYPE lab_category AS ENUM (
      'web_security',
      'network_security',
      'cryptography',
      'exploitation',
      'defensive',
      'forensics'
    );
  `);

  await queryInterface.sequelize.query(`
    CREATE TYPE lab_difficulty AS ENUM (
      'beginner',
      'intermediate',
      'advanced',
      'expert'
    );
  `);

  await queryInterface.createTable('labs', {
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
    category: {
      type: DataTypes.ENUM(
        'web_security',
        'network_security',
        'cryptography',
        'exploitation',
        'defensive',
        'forensics'
      ),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      allowNull: false,
    },
    estimated_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Estimated completion time in minutes',
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    container_config: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Docker container configuration',
    },
    exercises: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Lab exercises and challenges',
    },
    prerequisites: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    learning_objectives: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    timeout_duration: {
      type: DataTypes.INTEGER,
      defaultValue: 3600000,
      comment: 'Session timeout in milliseconds',
    },
    max_instances_per_user: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
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
  await queryInterface.addIndex('labs', ['category']);
  await queryInterface.addIndex('labs', ['difficulty']);
  await queryInterface.addIndex('labs', ['is_active']);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('labs');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS lab_category;');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS lab_difficulty;');
};
