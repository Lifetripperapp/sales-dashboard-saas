'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns
    await queryInterface.addColumn('technician_objectives', 'criteria', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Success criteria for the objective',
    });

    await queryInterface.addColumn('technician_objectives', 'status', {
      type: Sequelize.ENUM('pendiente', 'en_progreso', 'completado', 'no_completado'),
      allowNull: false,
      defaultValue: 'pendiente',
      comment: 'Current status of the objective',
    });

    await queryInterface.addColumn('technician_objectives', 'completion_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date when the objective was completed',
    });

    await queryInterface.addColumn('technician_objectives', 'weight', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
      comment: 'Weight of the objective in overall evaluation (0-100)',
    });

    await queryInterface.addColumn('technician_objectives', 'evidence', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Link or reference to evidence of completion',
    });

    await queryInterface.addColumn('technician_objectives', 'is_global', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this is a global objective for all technicians',
    });

    // Add indexes for new columns
    await queryInterface.addIndex('technician_objectives', ['status']);
    await queryInterface.addIndex('technician_objectives', ['is_global']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('technician_objectives', ['status']);
    await queryInterface.removeIndex('technician_objectives', ['is_global']);

    // Remove columns
    await queryInterface.removeColumn('technician_objectives', 'criteria');
    await queryInterface.removeColumn('technician_objectives', 'status');
    await queryInterface.removeColumn('technician_objectives', 'completion_date');
    await queryInterface.removeColumn('technician_objectives', 'weight');
    await queryInterface.removeColumn('technician_objectives', 'evidence');
    await queryInterface.removeColumn('technician_objectives', 'is_global');

    // Remove ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_technician_objectives_status;');
  },
}; 