'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // First, drop the constraints
      await queryInterface.removeConstraint('technician_evaluations', 'technician_evaluations_technicianId_fkey');
      
      // Then, add them back with the correct reference
      await queryInterface.addConstraint('technician_evaluations', {
        fields: ['technicianId'],
        type: 'foreign key',
        name: 'technician_evaluations_technicianId_fkey',
        references: {
          table: 'technicians',
          field: 'id'
        },
        onDelete: 'CASCADE'
      });
    } catch (error) {
      console.error('Error updating constraints:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // First, drop the new constraints
      await queryInterface.removeConstraint('technician_evaluations', 'technician_evaluations_technicianId_fkey');
      
      // Then, add them back with the original reference
      await queryInterface.addConstraint('technician_evaluations', {
        fields: ['technicianId'],
        type: 'foreign key',
        name: 'technician_evaluations_technicianId_fkey',
        references: {
          table: 'Technician',
          field: 'id'
        },
        onDelete: 'CASCADE'
      });
    } catch (error) {
      console.error('Error reverting constraints:', error);
    }
  }
}; 