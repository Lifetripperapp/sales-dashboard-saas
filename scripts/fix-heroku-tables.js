/**
 * UYTECH Sales Dashboard - Fix Missing Tables Script
 * Script to fix missing junction tables in Heroku PostgreSQL database
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

async function createSalespersonObjectiveTable() {
  try {
    console.log('Creating SalespersonObjective junction table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SalespersonObjective" (
        "id" UUID NOT NULL,
        "salespersonId" UUID NOT NULL,
        "qualitativeObjectiveId" UUID NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY ("id")
      );
    `);
    
    // Add foreign key constraints
    await sequelize.query(`
      ALTER TABLE "SalespersonObjective" 
      ADD CONSTRAINT "SalespersonObjective_salespersonId_fkey" 
      FOREIGN KEY ("salespersonId") REFERENCES "Salesperson"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `).catch(err => {
      console.log('Error adding salespersonId foreign key constraint:', err.message);
    });
    
    await sequelize.query(`
      ALTER TABLE "SalespersonObjective" 
      ADD CONSTRAINT "SalespersonObjective_qualitativeObjectiveId_fkey" 
      FOREIGN KEY ("qualitativeObjectiveId") REFERENCES "QualitativeObjective"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `).catch(err => {
      console.log('Error adding qualitativeObjectiveId foreign key constraint:', err.message);
    });
    
    console.log('✅ SalespersonObjective table created successfully');
  } catch (error) {
    console.error('Error creating SalespersonObjective table:', error.message);
  }
}

async function createSalespersonQuantitativeObjectiveTable() {
  try {
    console.log('Creating SalespersonQuantitativeObjective junction table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SalespersonQuantitativeObjective" (
        "id" UUID NOT NULL,
        "salespersonId" UUID NOT NULL,
        "quantitativeObjectiveId" UUID NOT NULL,
        "individualTarget" DECIMAL(10, 2) NOT NULL DEFAULT '0',
        "currentValue" DECIMAL(10, 2) NOT NULL DEFAULT '0',
        "displayOrder" INTEGER NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY ("id")
      );
    `);
    
    // Add foreign key constraints
    await sequelize.query(`
      ALTER TABLE "SalespersonQuantitativeObjective" 
      ADD CONSTRAINT "SalespersonQuantitativeObjective_salespersonId_fkey" 
      FOREIGN KEY ("salespersonId") REFERENCES "Salesperson"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `).catch(err => {
      console.log('Error adding salespersonId foreign key constraint:', err.message);
    });
    
    await sequelize.query(`
      ALTER TABLE "SalespersonQuantitativeObjective" 
      ADD CONSTRAINT "SalespersonQuantitativeObjective_quantitativeObjectiveId_fkey" 
      FOREIGN KEY ("quantitativeObjectiveId") REFERENCES "QuantitativeObjective"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `).catch(err => {
      console.log('Error adding quantitativeObjectiveId foreign key constraint:', err.message);
    });
    
    console.log('✅ SalespersonQuantitativeObjective table created successfully');
  } catch (error) {
    console.error('Error creating SalespersonQuantitativeObjective table:', error.message);
  }
}

async function fixHerokuTables() {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection to Heroku PostgreSQL established successfully.');

    await createSalespersonObjectiveTable();
    await createSalespersonQuantitativeObjectiveTable();

    console.log('✨ Table fix operation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing Heroku tables:');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixHerokuTables(); 