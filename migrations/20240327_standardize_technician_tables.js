'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // 1. Update Client table's foreign key reference
      await queryInterface.sequelize.query(`
        ALTER TABLE "Client" 
        DROP CONSTRAINT IF EXISTS "Client_tecnicoId_fkey",
        ADD CONSTRAINT "Client_tecnicoId_fkey" 
        FOREIGN KEY ("tecnicoId") 
        REFERENCES "Technician"(id) 
        ON DELETE SET NULL;
      `);

      console.log('Successfully standardized technician-related tables');
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Revert Client table's foreign key reference
      await queryInterface.sequelize.query(`
        ALTER TABLE "Client" 
        DROP CONSTRAINT IF EXISTS "Client_tecnicoId_fkey";
      `);

      console.log('Successfully reverted technician-related tables standardization');
    } catch (error) {
      console.error('Error in migration rollback:', error);
      throw error;
    }
  }
}; 