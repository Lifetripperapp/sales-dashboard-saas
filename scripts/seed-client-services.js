/**
 * UYTECH Sales Dashboard - Client Services Seed Script
 * Script to populate the database with clients, services, and technicians from the categorized data
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../src/models');
const { Client, Service, ClientService, Technician } = db;

// Import the JSON data
const clientesServiciosData = require('../migrations/cliente_servicios_categorizados.json');

// Map to track created services by name
const serviceMap = new Map();
// Map to track created technicians by name
const technicianMap = new Map();
// Set to track unique categories
const categories = new Set();
// Set to track unique service names
const serviceNames = new Set();
// Set to track unique technician names
const technicianNames = new Set();

// Extract all categories and service names first
clientesServiciosData.forEach(client => {
  client.servicios.forEach(servicio => {
    categories.add(servicio.categoria);
    serviceNames.add(servicio.servicio);
    
    // Extract technician names from "Técnico (Nombre Completo)" service entries
    if (servicio.servicio === 'Técnico (Nombre Completo)' && servicio.nota) {
      technicianNames.add(servicio.nota);
    }
  });
});

async function seedDatabase() {
  try {
    console.log('🔄 Checking database connection...');
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Start a transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // 1. Create all services first
      console.log(`Creating ${serviceNames.size} unique services...`);
      
      for (const serviceName of serviceNames) {
        // Skip the "Técnico (Nombre Completo)" and "Vendedor (Nombre Completo)" pseudo-services
        if (serviceName === 'Técnico (Nombre Completo)' || serviceName === 'Vendedor (Nombre Completo)') {
          continue;
        }
        
        let category = '';
        // Find the category for this service from the data
        for (const client of clientesServiciosData) {
          const serviceEntry = client.servicios.find(s => s.servicio === serviceName);
          if (serviceEntry) {
            category = serviceEntry.categoria;
            break;
          }
        }
        
        if (!category) {
          category = 'Otros'; // Default category if none found
        }
        
        // Create service
        const [service, created] = await Service.findOrCreate({
          where: { nombre: serviceName },
          defaults: {
            id: uuidv4(),
            nombre: serviceName,
            categoria: category,
            descripcion: `Servicio de ${serviceName}`
          },
          transaction
        });
        
        serviceMap.set(serviceName, service.id);
        console.log(`Service ${created ? 'created' : 'found'}: ${serviceName} (${category})`);
      }
      
      // 2. Create all technicians
      console.log(`Creating ${technicianNames.size} unique technicians...`);
      
      for (const techName of technicianNames) {
        // Skip technician entries with placeholders
        if (techName === '-' || techName.includes('no se lo')) {
          continue;
        }
        
        // Generate a valid email from technician name
        const emailName = techName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^a-z0-9]/g, '.') // Convert non-alphanumeric to dots
          .replace(/\.+/g, '.') // Replace multiple dots with a single one
          .replace(/^\.|\.$/g, ''); // Remove leading/trailing dots
          
        const email = `${emailName}@uytech.com.uy`;
        
        const [technician, created] = await Technician.findOrCreate({
          where: { nombre: techName },
          defaults: {
            id: uuidv4(),
            nombre: techName,
            email: email,
            estado: 'active'
          },
          transaction
        });
        
        technicianMap.set(techName, technician.id);
        console.log(`Technician ${created ? 'created' : 'found'}: ${techName}`);
      }
      
      // 3. Create all clients and their service associations
      console.log(`Creating ${clientesServiciosData.length} clients with their services...`);
      
      for (const clientData of clientesServiciosData) {
        // Extract technician if present
        let technicianId = null;
        const techEntry = clientData.servicios.find(s => s.servicio === 'Técnico (Nombre Completo)');
        
        if (techEntry && techEntry.nota && technicianMap.has(techEntry.nota)) {
          technicianId = technicianMap.get(techEntry.nota);
        }
        
        // Create client
        const [client, created] = await Client.findOrCreate({
          where: { nombre: clientData.cliente },
          defaults: {
            id: uuidv4(),
            nombre: clientData.cliente,
            tecnicoId: technicianId,
            contratoSoporte: true
          },
          transaction
        });
        
        console.log(`Client ${created ? 'created' : 'found'}: ${clientData.cliente}`);
        
        // Add services to the client
        for (const servicio of clientData.servicios) {
          // Skip technician and salesperson entries as they're not actual services
          if (servicio.servicio === 'Técnico (Nombre Completo)' || servicio.servicio === 'Vendedor (Nombre Completo)') {
            continue;
          }
          
          // Get service ID
          const serviceId = serviceMap.get(servicio.servicio);
          
          if (serviceId) {
            // Create client-service association
            const [clientService, csCreated] = await ClientService.findOrCreate({
              where: {
                clientId: client.id,
                servicioId: serviceId
              },
              defaults: {
                id: uuidv4(),
                clientId: client.id,
                servicioId: serviceId,
                notas: servicio.nota || '',
                fechaAsignacion: new Date()
              },
              transaction
            });
            
            console.log(`Service ${servicio.servicio} ${csCreated ? 'added to' : 'already exists for'} client ${clientData.cliente}`);
          } else {
            console.log(`⚠️ Warning: Service not found for ${servicio.servicio}`);
          }
        }
      }
      
      // Commit transaction
      await transaction.commit();
      console.log('✅ Database seeded successfully!');
      
      // Print summary
      console.log('\n📊 Seed Summary:');
      console.log(`Services created: ${serviceMap.size}`);
      console.log(`Technicians created: ${technicianMap.size}`);
      console.log(`Clients processed: ${clientesServiciosData.length}`);
      
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      console.error('❌ Error seeding database:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:');
    console.error(error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

seedDatabase(); 