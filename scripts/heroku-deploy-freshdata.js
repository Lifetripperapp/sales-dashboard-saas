/**
 * UYTECH Sales Dashboard - Heroku Fresh Data Deployment
 * Deploys freshly generated migrations and seeds to Heroku
 */
require('dotenv').config();
const { execSync } = require('child_process');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const config = require('../sequelize.config');

// Get production database configuration
const dbConfig = config.production;

// Connect to Heroku PostgreSQL
const sequelize = new Sequelize(dbConfig.url, {
  ...dbConfig,
  // Set SSL to null instead of forcing it
  dialectOptions: {
    ssl: false
  },
  logging: false, // Disable logging for cleaner output
});

// Function to check if a table exists
async function tableExists(tableName) {
  try {
    // PostgreSQL specific query
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = :tableName
      );
    `;
    const result = await sequelize.query(query, {
      replacements: { tableName: tableName.toLowerCase() },
      type: Sequelize.QueryTypes.SELECT,
      plain: true
    });
    return result.exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error.message);
    return false;
  }
}

// Function to drop all tables - destructive!
async function dropAllTables() {
  try {
    console.log('🔄 Dropping all existing tables in Heroku database...');
    // Get list of tables
    const query = `
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT IN ('SequelizeMeta');
    `;
    
    const results = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    // Drop each table
    for (const row of results) {
      const tableName = row.tablename;
      console.log(`🔄 Dropping table: ${tableName}`);
      await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }
    
    console.log('✅ All tables dropped successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error dropping tables:', error.message);
    return false;
  }
}

// Execute migrations
async function runMigrations() {
  try {
    console.log('🔄 Running migrations on Heroku database...');
    
    // Check if SequelizeMeta exists
    const sequelizeMetaExists = await tableExists('SequelizeMeta');
    if (!sequelizeMetaExists) {
      console.log('Creating SequelizeMeta table...');
      await sequelize.query(`
        CREATE TABLE "SequelizeMeta" (
          name VARCHAR(255) NOT NULL PRIMARY KEY
        );
      `);
    } else {
      // Clear SequelizeMeta to start fresh
      await sequelize.query('DELETE FROM "SequelizeMeta"');
    }
    
    // Get migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort(); // Ensure correct order
    
    // Execute each migration
    for (const file of migrationFiles) {
      console.log(`🔄 Running migration: ${file}`);
      
      try {
        // Execute the migration
        const migration = require(path.join(migrationsDir, file));
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        
        // Record in SequelizeMeta
        await sequelize.query(`
          INSERT INTO "SequelizeMeta" (name) VALUES (?)
        `, {
          replacements: [file]
        });
        
        console.log(`✅ Migration completed: ${file}`);
      } catch (error) {
        console.error(`❌ Error in migration ${file}:`, error.message);
        // Continue with next migration instead of stopping
      }
    }
    
    console.log('✅ Migrations applied successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    return false;
  }
}

// Execute seeders
async function runSeeders() {
  try {
    console.log('🔄 Running seeders on Heroku database...');
    
    // Get seeder files
    const seedersDir = path.join(__dirname, '..', 'seeders');
    const seederFiles = fs.readdirSync(seedersDir)
      .filter(file => file.endsWith('.js') && !file.includes('helpers'))
      .sort(); // Ensure correct order
    
    // Execute each seeder
    for (const file of seederFiles) {
      console.log(`🔄 Running seeder: ${file}`);
      
      try {
        const seeder = require(path.join(seedersDir, file));
        await seeder.up(sequelize.getQueryInterface(), Sequelize);
        console.log(`✅ Seeder completed: ${file}`);
      } catch (error) {
        console.error(`❌ Error in seeder ${file}:`, error.message);
        // Continue with next seeder instead of stopping
      }
    }
    
    console.log('✅ Seeders applied successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error running seeders:', error.message);
    return false;
  }
}

// Main function to deploy fresh data to Heroku
async function deployFreshData() {
  try {
    console.log('🔄 Connecting to Heroku PostgreSQL database...');
    await sequelize.authenticate();
    console.log('✅ Connection established successfully.');
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will delete all existing data in the Heroku database.');
    console.log('⚠️  This action is irreversible. Make sure you have a backup if needed.\n');
    
    // Drop all tables
    await dropAllTables();
    
    // Run migrations
    const migrationsSuccess = await runMigrations();
    if (!migrationsSuccess) {
      console.warn('⚠️ Some migrations had issues, but we will continue...');
    }
    
    // Run seeders
    const seedersSuccess = await runSeeders();
    if (!seedersSuccess) {
      console.warn('⚠️ Some seeders had issues, but we will continue...');
    }
    
    console.log('\n✨ Heroku database has been successfully updated with fresh data!');
  } catch (error) {
    console.error('❌ Error deploying fresh data to Heroku:');
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Run the deployment
deployFreshData(); 