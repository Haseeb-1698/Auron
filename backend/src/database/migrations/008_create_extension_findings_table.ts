import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Create extension_findings table
 * Stores security findings from the Auron browser extension
 */
export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('extension_findings', {
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
        comment: 'User who owns this finding',
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'URL where the security issue was found',
      },
      finding_type: {
        type: DataTypes.ENUM('cookie', 'session', 'csp', 'phishing', 'dom-analysis'),
        allowNull: false,
        comment: 'Type of security finding',
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: 'Detailed information about the finding',
      },
      risk_level: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        comment: 'Risk severity level',
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

    // Add indexes for better query performance
    await queryInterface.addIndex('extension_findings', ['user_id'], {
      name: 'idx_extension_findings_user_id',
    });

    await queryInterface.addIndex('extension_findings', ['finding_type'], {
      name: 'idx_extension_findings_type',
    });

    await queryInterface.addIndex('extension_findings', ['risk_level'], {
      name: 'idx_extension_findings_risk',
    });

    await queryInterface.addIndex('extension_findings', ['created_at'], {
      name: 'idx_extension_findings_created',
    });

    // Composite index for common queries (user + type)
    await queryInterface.addIndex('extension_findings', ['user_id', 'finding_type'], {
      name: 'idx_extension_findings_user_type',
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    // Drop indexes first
    await queryInterface.removeIndex('extension_findings', 'idx_extension_findings_user_id');
    await queryInterface.removeIndex('extension_findings', 'idx_extension_findings_type');
    await queryInterface.removeIndex('extension_findings', 'idx_extension_findings_risk');
    await queryInterface.removeIndex('extension_findings', 'idx_extension_findings_created');
    await queryInterface.removeIndex('extension_findings', 'idx_extension_findings_user_type');

    // Drop the table
    await queryInterface.dropTable('extension_findings');

    // Drop the ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_extension_findings_finding_type"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_extension_findings_risk_level"');
  },
};
