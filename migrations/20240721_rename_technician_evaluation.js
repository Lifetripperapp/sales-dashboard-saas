'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the old index first
    await queryInterface.removeIndex('TechnicianEvaluation', 'technician_evaluation_period_unique');
    
    // Rename the table
    await queryInterface.renameTable('TechnicianEvaluation', 'technician_evaluations');
    
    // Recreate the index on the new table
    await queryInterface.addIndex('technician_evaluations', ['technicianId', 'year', 'semester'], {
      unique: true,
      name: 'technician_evaluation_period_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop the index first
    await queryInterface.removeIndex('technician_evaluations', 'technician_evaluation_period_unique');
    
    // Rename the table back
    await queryInterface.renameTable('technician_evaluations', 'TechnicianEvaluation');
    
    // Recreate the index on the old table
    await queryInterface.addIndex('TechnicianEvaluation', ['technicianId', 'year', 'semester'], {
      unique: true,
      name: 'technician_evaluation_period_unique'
    });
  }
}; 