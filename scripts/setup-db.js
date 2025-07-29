/**
 * UYTECH Sales Dashboard - Database Setup Script
 * Script to initialize the development database
 */
require('dotenv').config();
const { execSync } = require('child_process');
const { Sequelize } = require('sequelize');
const config = require('../sequelize.config');

const dbConfig = config.development;
const sequelize = new Sequelize(dbConfig.url, dbConfig);

async function setupDatabase() {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection established successfully.');

    console.log('🔄 Running migrations...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully.');

    console.log('🔄 Seeding database with initial data...');
    execSync('npx sequelize-cli db:seed:all', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully.');

    console.log('✨ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:');
    console.error(error);
    process.exit(1);
  }
}

setupDatabase(); 