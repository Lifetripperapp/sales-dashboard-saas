/**
 * UYTECH Sales Dashboard - Make Weight and Assigned Salespersons Non-Mandatory
 * Script to modify QualitativeObjective table to make weight field nullable
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('../sequelize.config');

const dbConfig = config.production;
const sequelize = new Sequelize(dbConfig.url, {
  ...dbConfig,
  // Ensure SSL connection
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // For Heroku PostgreSQL
    },
  },
});

async function makeWeightNullable() {
  try {
    console.log('Modifying QualitativeObjective table - making weight nullable...');
    
    // Alter the weight column to allow NULL values
    await sequelize.query(`
      ALTER TABLE "QualitativeObjective" 
      ALTER COLUMN "weight" DROP NOT NULL;
    `);
    
    console.log('✅ Made weight column nullable');
    
  } catch (error) {
    console.error('Error modifying weight column:', error.message);
  }
}

async function checkQualitativeObjectiveModel() {
  try {
    // Check the current structure of the table
    const tableInfo = await sequelize.query(`
      SELECT 
        column_name, 
        is_nullable, 
        data_type 
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'QualitativeObjective';
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('Current QualitativeObjective table structure:');
    tableInfo.forEach(column => {
      console.log(`${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
  } catch (error) {
    console.error('Error checking QualitativeObjective table:', error.message);
  }
}

async function fixQualitativeObjectiveRequirements() {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection to Heroku PostgreSQL established successfully.');

    // Check current table structure
    await checkQualitativeObjectiveModel();
    
    // Fix the table
    await makeWeightNullable();
    
    // Check the updated table structure
    await checkQualitativeObjectiveModel();

    console.log('✨ Modifications completed!');
    console.log('');
    console.log('NOTES:');
    console.log('1. Weight field is now nullable in the database');
    console.log('2. You still need to update the API routes to remove validation for weight');
    console.log('3. You also need to update the API routes to make salespersonIds optional for all objectives');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during modifications:');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixQualitativeObjectiveRequirements(); 