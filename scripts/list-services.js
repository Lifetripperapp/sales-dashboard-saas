/**
 * Script to list all services in the database
 */
require('dotenv').config();
const db = require('../src/models');
const { Service } = db;

async function listServices() {
  try {
    // Connect to database
    await db.sequelize.authenticate();
    console.log('Connected to database');
    
    // Fetch all services
    const services = await Service.findAll({
      order: [['nombre', 'ASC']]
    });
    
    // Print services
    console.log('\n=== All Services ===');
    console.log('Total services:', services.length);
    console.log('-------------------------');
    
    services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.nombre} (${service.categoria || 'No category'})`);
      if (service.descripcion) {
        console.log(`   Description: ${service.descripcion}`);
      }
      console.log(`   ID: ${service.id}`);
      console.log('-------------------------');
    });
    
  } catch (error) {
    console.error('Error listing services:', error);
  } finally {
    // Close the connection
    await db.sequelize.close();
  }
}

// Run the function
listServices(); 