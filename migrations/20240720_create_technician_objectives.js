'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('technician_objectives', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      technician_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'technicians',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
      },
      is_next_objective: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'True for next period objectives, false for previous objectives',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes
    await queryInterface.addIndex('technician_objectives', ['technician_id']);
    await queryInterface.addIndex('technician_objectives', ['is_next_objective']);
    await queryInterface.addIndex('technician_objectives', ['completed']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('technician_objectives');
  },
}; 