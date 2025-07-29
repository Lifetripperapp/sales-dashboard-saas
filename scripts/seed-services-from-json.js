/**
 * Script to seed services and client-service relationships from JSON file
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/models');
const { Service, Client, ClientService } = db;

async function seedServicesFromJson() {
  try {
    // Connect to database
    await db.sequelize.authenticate();
    console.log('Connected to database');
    
    // Read JSON file
    const jsonPath = path.join(__dirname, '../migrations/clientes_con_metadata_y_servicios.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`Loaded ${jsonData.length} client records from JSON file`);
    
    // Extract unique services
    const uniqueServices = new Map();
    jsonData.forEach(clientData => {
      if (clientData.servicios && Array.isArray(clientData.servicios)) {
        clientData.servicios.forEach(serviceData => {
          // Skip metadata services like "Vendedor (Nombre Completo)"
          if (!serviceData.servicio.includes('(Nombre Completo)') && 
              !serviceData.servicio.includes('Email')) {
            // Use service name as key to avoid duplicates
            uniqueServices.set(serviceData.servicio, {
              nombre: serviceData.servicio, 
              categoria: serviceData.categoria || 'Sin categoría',
              descripcion: null
            });
          }
        });
      }
    });
    
    console.log(`Found ${uniqueServices.size} unique services to create`);
    
    // Create services in database
    const services = [];
    for (const serviceData of uniqueServices.values()) {
      const [service, created] = await Service.findOrCreate({
        where: { nombre: serviceData.nombre },
        defaults: serviceData
      });
      
      services.push(service);
      console.log(`${created ? 'Created' : 'Found existing'} service: ${service.nombre}`);
    }
    
    console.log(`\nCreated/found ${services.length} services`);
    
    // Associate services with clients
    console.log('\nAssociating services with clients...');
    let associationsCreated = 0;
    
    for (const clientData of jsonData) {
      if (!clientData.servicios || !Array.isArray(clientData.servicios)) {
        continue;
      }
      
      // Find client
      const client = await Client.findOne({ 
        where: { nombre: clientData.cliente } 
      });
      
      if (!client) {
        console.log(`Warning: Client not found: ${clientData.cliente}`);
        continue;
      }
      
      // Associate services
      for (const serviceData of clientData.servicios) {
        // Skip metadata services
        if (serviceData.servicio.includes('(Nombre Completo)') || 
            serviceData.servicio.includes('Email')) {
          continue;
        }
        
        const service = await Service.findOne({
          where: { nombre: serviceData.servicio }
        });
        
        if (!service) {
          console.log(`Warning: Service not found: ${serviceData.servicio}`);
          continue;
        }
        
        // Create client-service association with note
        const [clientService, created] = await ClientService.findOrCreate({
          where: {
            clientId: client.id,
            serviceId: service.id
          },
          defaults: {
            nota: serviceData.nota
          }
        });
        
        if (created) {
          associationsCreated++;
        }
      }
    }
    
    console.log(`\nCreated ${associationsCreated} client-service associations`);
    console.log('Seeding completed successfully');
    
  } catch (error) {
    console.error('Error seeding services:', error);
  } finally {
    // Close the connection
    await db.sequelize.close();
  }
}

// Run the function
seedServicesFromJson(); 