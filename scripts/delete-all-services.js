/**
 * Script to delete all services from the database
 * WARNING: This script will permanently remove all service records
 */
require('dotenv').config();
const db = require('../src/models');
const { Service } = db;

async function deleteAllServices() {
  try {
    // Connect to database
    await db.sequelize.authenticate();
    console.log('Connected to database');
    
    // Count services before deletion
    const count = await Service.count();
    console.log(`Found ${count} services to delete`);
    
    // Confirm deletion
    console.log('\nDeleting all services...');
    
    // Delete all services
    const result = await Service.destroy({ 
      where: {},  // Empty where clause matches all records
      cascade: true // Enable cascading deletes
    });
    
    console.log(`\nSuccessfully deleted ${result} service records`);
    
  } catch (error) {
    console.error('Error deleting services:', error);
  } finally {
    // Close the connection
    await db.sequelize.close();
  }
}

// Run the function
deleteAllServices(); 