'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Drop the lowercase tables if they exist
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS technicians CASCADE;');
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS technician CASCADE;');
      
      console.log('Successfully cleaned up incorrect technician tables');
    } catch (error) {
      console.error('Error in cleanup migration:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    // There's no sensible down migration since we're cleaning up incorrect tables
    console.log('No down migration needed for table cleanup');
  },
}; 