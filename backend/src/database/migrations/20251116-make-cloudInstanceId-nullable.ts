import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.changeColumn('lab_instances', 'cloudInstanceId', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.changeColumn('lab_instances', 'cloudInstanceId', {
      type: DataTypes.STRING,
      allowNull: false,
    });
  },
};
