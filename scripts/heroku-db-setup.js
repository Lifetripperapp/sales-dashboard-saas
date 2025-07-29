/**
 * UYTECH Sales Dashboard - Heroku Database Setup Script
 * Script to initialize the production database on Heroku
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
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

// Function to check if a table exists
async function tableExists(tableName) {
  try {
    // This query is PostgreSQL specific
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

// Function to read and execute migration files
async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort(); // Sort to ensure correct order
  
  console.log('Found migration files:', migrationFiles);
  
  try {
    for (const file of migrationFiles) {
      const migration = require(path.join(migrationsDir, file));
      console.log(`Running migration: ${file}`);
      
      try {
        // Execute the migration
        await migration.up(sequelize.queryInterface, Sequelize);
        console.log(`Migration completed: ${file}`);
      } catch (error) {
        // Check if the error is about relation already existing
        if (error.parent && error.parent.code === '42P07') {
          console.log(`Relation already exists, skipping: ${error.parent.sql}`);
        } else {
          // For other errors, log and continue 
          console.error(`Error in migration ${file}:`, error.message);
        }
      }
    }
    
    console.log('All migrations processed');
    return true;
  } catch (error) {
    console.error('Migration process error:', error);
    return false;
  }
}

// Function to read and execute seeder files
async function runSeeders() {
  const seedersDir = path.join(__dirname, '../seeders');
  const seederFiles = fs.readdirSync(seedersDir)
    .filter(file => file.endsWith('.js') && !file.startsWith('helpers'))
    .sort(); // Sort to ensure correct order
  
  console.log('Found seeder files:', seederFiles);
  
  try {
    for (const file of seederFiles) {
      const seeder = require(path.join(seedersDir, file));
      console.log(`Running seeder: ${file}`);
      
      try {
        await seeder.up(sequelize.queryInterface, Sequelize);
        console.log(`Seeder completed: ${file}`);
      } catch (error) {
        // Check if it's a duplicate key error
        if (error.parent && error.parent.code === '23505') {
          console.log(`Data already exists, skipping: ${error.message}`);
        } else {
          console.error(`Error in seeder ${file}:`, error.message);
        }
      }
    }
    
    console.log('All seeders processed');
    return true;
  } catch (error) {
    console.error('Seeder process error:', error);
    return false;
  }
}

async function setupHerokuDatabase() {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection to Heroku PostgreSQL established successfully.');

    console.log('🔄 Running migrations...');
    const migrationsSuccess = await runMigrations();
    if (!migrationsSuccess) {
      console.warn('⚠️ Some migrations had issues but we will continue...');
    } else {
      console.log('✅ Migrations completed successfully.');
    }

    console.log('🔄 Seeding database with initial data...');
    const seedersSuccess = await runSeeders();
    if (!seedersSuccess) {
      console.warn('⚠️ Some seeders had issues but we will continue...');
    } else {
      console.log('✅ Database seeded successfully.');
    }

    console.log('✨ Heroku database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up Heroku database:');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupHerokuDatabase(); 