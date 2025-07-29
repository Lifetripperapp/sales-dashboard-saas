/**
 * UYTECH Sales Dashboard - Remove Salesperson Objectives Script
 * This script removes all objective assignments for a specific salesperson
 * to allow the salesperson to be deleted
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('../sequelize.config');

// Get the database configuration for production
const dbConfig = config.production;
const sequelize = new Sequelize(dbConfig.url, {
  ...dbConfig,
  // Ensure SSL connection for Heroku PostgreSQL
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function removeSalespersonObjectives(salespersonId) {
  if (!salespersonId) {
    console.error('Error: Salesperson ID is required');
    process.exit(1);
  }

  try {
    console.log(`Removing all objective assignments for salesperson ID: ${salespersonId}`);

    // First check if the salesperson exists
    const [salespersonResults] = await sequelize.query(`
      SELECT * FROM "Salesperson" WHERE id = '${salespersonId}'
    `);

    if (salespersonResults.length === 0) {
      console.error(`Error: Salesperson with ID ${salespersonId} not found`);
      process.exit(1);
    }

    console.log(`Found salesperson: ${salespersonResults[0].nombre}`);

    // Remove quantitative objective assignments
    const [quantitativeResults] = await sequelize.query(`
      DELETE FROM "SalespersonQuantitativeObjective" 
      WHERE "salespersonId" = '${salespersonId}'
      RETURNING id, "quantitativeObjectiveId"
    `);

    console.log(`Removed ${quantitativeResults.length} quantitative objective assignments`);
    
    // Remove qualitative objective assignments
    const [qualitativeResults] = await sequelize.query(`
      DELETE FROM "SalespersonObjective" 
      WHERE "salespersonId" = '${salespersonId}'
      RETURNING id, "qualitativeObjectiveId"
    `);

    console.log(`Removed ${qualitativeResults.length} qualitative objective assignments`);

    console.log('All objective assignments have been removed successfully.');
    console.log('You can now delete the salesperson.');

    process.exit(0);
  } catch (error) {
    console.error('Error removing objective assignments:', error);
    process.exit(1);
  }
}

// Get the salesperson ID from the command line arguments
const salespersonId = process.argv[2];
removeSalespersonObjectives(salespersonId); 