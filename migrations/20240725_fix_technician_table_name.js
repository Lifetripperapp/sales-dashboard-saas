'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // We'll just log here since this migration was replaced by a cleanup migration
    console.log('Migration skipped - replaced by 20240726_clean_up_technicians_table.js');
  },

  async down(queryInterface, Sequelize) {
    // No down migration needed
    console.log('No down migration needed');
  },
}; 