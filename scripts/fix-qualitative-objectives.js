/**
 * UYTECH Sales Dashboard - Fix Qualitative Objectives Script
 * Script to fix QualitativeObjective table structure in Heroku PostgreSQL
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

async function fixQualitativeObjectiveTable() {
  try {
    console.log('Modifying QualitativeObjective table...');
    
    // First, drop the foreign key constraint
    await sequelize.query(`
      ALTER TABLE "QualitativeObjective" 
      DROP CONSTRAINT IF EXISTS "QualitativeObjective_salespersonId_fkey";
    `).catch(err => {
      console.log('Error or constraint already dropped:', err.message);
    });
    
    // Make salespersonId column nullable
    await sequelize.query(`
      ALTER TABLE "QualitativeObjective" 
      ALTER COLUMN "salespersonId" DROP NOT NULL;
    `);
    
    console.log('✅ Made salespersonId column nullable');
    
    // Re-add the foreign key constraint with ON DELETE SET NULL
    await sequelize.query(`
      ALTER TABLE "QualitativeObjective" 
      ADD CONSTRAINT "QualitativeObjective_salespersonId_fkey" 
      FOREIGN KEY ("salespersonId") 
      REFERENCES "Salesperson"(id) 
      ON UPDATE CASCADE 
      ON DELETE SET NULL;
    `).catch(err => {
      console.log('Error adding foreign key constraint:', err.message);
    });
    
    console.log('✅ Updated foreign key constraint');
    
  } catch (error) {
    console.error('Error fixing QualitativeObjective table:', error.message);
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

async function fixQualitativeObjectivesData() {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection to Heroku PostgreSQL established successfully.');

    // Check current table structure
    await checkQualitativeObjectiveModel();
    
    // Fix the table
    await fixQualitativeObjectiveTable();
    
    // Check the updated table structure
    await checkQualitativeObjectiveModel();

    console.log('✨ QualitativeObjective table fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during QualitativeObjective table fix:');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixQualitativeObjectivesData(); 