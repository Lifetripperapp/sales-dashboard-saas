/**
 * UYTECH Sales Dashboard - Database Fix Script
 * Script to fix database issues caused by failed migrations
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('../sequelize.config');

const dbConfig = config.development;
const sequelize = new Sequelize(dbConfig.url, dbConfig);

async function fixDatabase() {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection established successfully.');

    console.log('🔄 Dropping problematic indexes if they exist...');
    // Drop the indexes first
    await sequelize.query('DROP INDEX IF EXISTS "quantitative_objective_template_id";');
    await sequelize.query('DROP INDEX IF EXISTS "quantitative_objective_id";');
    await sequelize.query('DROP INDEX IF EXISTS "quantitative_objective_salesperson_id";');
    await sequelize.query('DROP INDEX IF EXISTS "qualitative_objective_id";');
    await sequelize.query('DROP INDEX IF EXISTS "qualitative_objective_salesperson_id";');
    
    console.log('🔄 Dropping problematic tables if they exist...');
    // Drop both tables if they exist - order matters due to foreign key constraints
    await sequelize.query('DROP TABLE IF EXISTS "QuantitativeObjective" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "QualitativeObjective" CASCADE;');
    
    // Check if the migrations are in SequelizeMeta and remove them if they exist
    await sequelize.query('DELETE FROM "SequelizeMeta" WHERE name = \'20250430126000-create-quantitative-objective.js\';');
    await sequelize.query('DELETE FROM "SequelizeMeta" WHERE name = \'20250430127000-create-qualitative-objective.js\';');
    
    console.log('✅ Problem tables and indexes dropped successfully.');
    
    console.log('✨ Database fixed. Now run "npx sequelize-cli db:migrate" to apply missing migrations.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database:');
    console.error(error);
    process.exit(1);
  }
}

fixDatabase(); 