/**
 * UYTECH Sales Dashboard - Complete Workflow
 * Seed Heroku database from local database data
 * 
 * This script combines all steps:
 * 1. Extracts data from local database
 * 2. Creates migration and seed files
 * 3. Deploys to Heroku
 */
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Setup readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to execute a command and log output
function runCommand(command, description) {
  console.log(`\n🚀 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully.`);
    return true;
  } catch (error) {
    console.error(`❌ Error ${description.toLowerCase()}:`, error.message);
    return false;
  }
}

// Main function to run the workflow
async function seedHerokuFromLocal() {
  try {
    console.log('\n=== UYTECH Sales Dashboard - Heroku Database Seeding ===\n');
    
    // Confirm action
    console.log('⚠️  This script will:');
    console.log('  1. Extract data from your local database');
    console.log('  2. Generate new migration and seed files');
    console.log('  3. REPLACE ALL DATA in your Heroku database\n');
    
    // Ask for confirmation
    const answer = await new Promise(resolve => {
      rl.question('Are you sure you want to proceed? (y/N): ', resolve);
    });
    
    if (answer.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      rl.close();
      return;
    }
    
    // Step 1: Clean up old migrations and seeders
    console.log('\n📁 Step 1: Cleaning up old migration and seed files...');
    
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const seedersDir = path.join(__dirname, '..', 'seeders');
    
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.js'));
      
      for (const file of migrationFiles) {
        console.log(`  🗑️  Deleting migration: ${file}`);
        fs.unlinkSync(path.join(migrationsDir, file));
      }
    }
    
    if (fs.existsSync(seedersDir)) {
      const seederFiles = fs.readdirSync(seedersDir)
        .filter(file => file.endsWith('.js') && !file.includes('helpers'));
      
      for (const file of seederFiles) {
        console.log(`  🗑️  Deleting seeder: ${file}`);
        fs.unlinkSync(path.join(seedersDir, file));
      }
    }
    
    console.log('✅ Cleanup completed.');
    
    // Step 2: Extract data and generate files
    console.log('\n📊 Step 2: Extracting data from local database...');
    if (!runCommand('node scripts/extract-data.js', 'Data extraction')) {
      rl.close();
      return;
    }
    
    // Step 3: Deploy to Heroku
    console.log('\n🚀 Step 3: Deploying to Heroku...');
    
    // Ask for confirmation again
    const herokuConfirm = await new Promise(resolve => {
      rl.question('\n⚠️  This will DELETE ALL DATA in your Heroku database. Continue? (y/N): ', resolve);
    });
    
    if (herokuConfirm.toLowerCase() !== 'y') {
      console.log('Heroku deployment cancelled.');
      rl.close();
      return;
    }
    
    if (!runCommand('node scripts/heroku-deploy-freshdata.js', 'Heroku deployment')) {
      rl.close();
      return;
    }
    
    console.log('\n🎉 All steps completed successfully!');
    console.log('🔄 Your Heroku database now contains a copy of your local data.');
    console.log('🌐 Visit your Heroku app to verify the changes.');
    
  } catch (error) {
    console.error('❌ An unexpected error occurred:', error.message);
  } finally {
    rl.close();
  }
}

// Run the workflow
seedHerokuFromLocal(); 