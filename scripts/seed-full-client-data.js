/**
 * UYTECH Sales Dashboard - Full Client Data Seed Script
 * Script to populate the database with clients, salespersons, technicians, and services
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../src/models');
const { Client, Service, ClientService, Technician, Salesperson } = db;

// Import the JSON data
const clientesData = require('../migrations/clientes_con_metadata_y_servicios.json');

// Map to track created services by name
const serviceMap = new Map();
// Map to track created technicians by name
const technicianMap = new Map();
// Map to track created salespersons by name
const salespersonMap = new Map();
// Set to track unique categories
const categories = new Set();
// Set to track unique service names
const serviceNames = new Set();

async function seedDatabase() {
  console.log('Starting database seed process...');
  
  try {
    // Connect to the database
    await db.sequelize.authenticate();
    console.log('Database connection established.');
    
    // Initialize counters
    let clientsCreated = 0;
    let servicesCreated = 0;
    let clientServicesCreated = 0;
    let techniciansCreated = 0;
    let salespersonsCreated = 0;
    
    // First, create or update salespersons
    console.log('Creating or updating salespersons...');
    for (const clientData of clientesData) {
      if (clientData.vendedor && clientData.vendedor.nombre && !salespersonMap.has(clientData.vendedor.nombre)) {
        // Try to find existing salesperson by email
        let salesperson = await Salesperson.findOne({
          where: { email: clientData.vendedor.email }
        });
        
        if (!salesperson) {
          // Create if not exists
          salesperson = await Salesperson.create({
            id: uuidv4(),
            nombre: clientData.vendedor.nombre,
            email: clientData.vendedor.email || '',
            estado: 'active'
          });
          salespersonsCreated++;
        } else {
          console.log(`Salesperson with email ${clientData.vendedor.email} already exists. Updating...`);
          // Update existing record
          await salesperson.update({
            nombre: clientData.vendedor.nombre,
            estado: 'active'
          });
        }
        
        salespersonMap.set(clientData.vendedor.nombre, salesperson.id);
      }
    }
    console.log(`Created ${salespersonsCreated} salespersons`);
    
    // Create or update unique technicians
    console.log('Creating or updating technicians...');
    for (const clientData of clientesData) {
      if (clientData.tecnico && clientData.tecnico.nombre && !technicianMap.has(clientData.tecnico.nombre) && 
          clientData.tecnico.nombre !== null) {
        // Skip empty email checks
        if (!clientData.tecnico.email) {
          continue;
        }
        
        // Handle multiple emails by taking only the first one (before the slash)
        const technicianEmail = clientData.tecnico.email.includes('/') 
          ? clientData.tecnico.email.split('/')[0].trim()
          : clientData.tecnico.email;
          
        // Try to find existing technician by email
        let technician = await Technician.findOne({
          where: { email: technicianEmail }
        });
        
        if (!technician) {
          // Create if not exists
          technician = await Technician.create({
            id: uuidv4(),
            nombre: clientData.tecnico.nombre,
            email: technicianEmail || '',
            estado: 'active'
          });
          techniciansCreated++;
        } else {
          console.log(`Technician with email ${technicianEmail} already exists. Updating...`);
          // Update existing record
          await technician.update({
            nombre: clientData.tecnico.nombre,
            estado: 'active'
          });
        }
        
        technicianMap.set(clientData.tecnico.nombre, technician.id);
      }
    }
    console.log(`Created ${techniciansCreated} technicians`);
    
    // Create all unique services
    console.log('Creating services...');
    for (const clientData of clientesData) {
      if (clientData.servicios) {
        for (const serviceData of clientData.servicios) {
          // Skip metadata fields that aren't real services
          if (
            serviceData.servicio === 'Vendedor (Nombre Completo)' ||
            serviceData.servicio === 'Técnico (Nombre Completo)' ||
            serviceData.servicio === 'Vendedor Email' ||
            serviceData.servicio === 'Técnico Email'
          ) {
            continue;
          }
          
          // Track unique categories and service names
          if (serviceData.categoria) {
            categories.add(serviceData.categoria);
          }
          if (serviceData.servicio) {
            serviceNames.add(serviceData.servicio);
          }
          
          // Check if service already exists
          let service = await Service.findOne({
            where: { nombre: serviceData.servicio }
          });
          
          if (!service) {
            service = await Service.create({
              id: uuidv4(),
              nombre: serviceData.servicio,
              categoria: serviceData.categoria || 'Otros',
            });
            servicesCreated++;
          }
          
          // Store service ID in map for later use
          serviceMap.set(serviceData.servicio, service.id);
        }
      }
    }
    console.log(`Created ${servicesCreated} services`);
    
    // Now create clients and their service relationships
    console.log('Creating clients and client-service relationships...');
    for (const clientData of clientesData) {
      // Get salesperson and technician IDs if available
      const vendedorId = clientData.vendedor && clientData.vendedor.nombre ? 
        salespersonMap.get(clientData.vendedor.nombre) : null;
        
      let tecnicoId = null;
      if (clientData.tecnico && clientData.tecnico.nombre && clientData.tecnico.nombre !== null) {
        tecnicoId = technicianMap.get(clientData.tecnico.nombre);
      }
      
      // Check if client already exists by name
      let client = await Client.findOne({
        where: { nombre: clientData.cliente }
      });
      
      if (!client) {
        // Create new client
        client = await Client.create({
          id: uuidv4(),
          nombre: clientData.cliente,
          vendedorId,
          tecnicoId,
          contratoSoporte: false
        });
        clientsCreated++;
      } else {
        console.log(`Client ${clientData.cliente} already exists. Updating vendor and technician...`);
        // Update existing client with new vendor/technician
        await client.update({
          vendedorId,
          tecnicoId
        });
      }
      
      // Create client-service relationships
      if (clientData.servicios) {
        for (const serviceData of clientData.servicios) {
          // Skip metadata fields that aren't real services
          if (
            serviceData.servicio === 'Vendedor (Nombre Completo)' ||
            serviceData.servicio === 'Técnico (Nombre Completo)' ||
            serviceData.servicio === 'Vendedor Email' ||
            serviceData.servicio === 'Técnico Email'
          ) {
            continue;
          }
          
          const serviceId = serviceMap.get(serviceData.servicio);
          if (serviceId) {
            // Check if client-service relationship already exists
            const existingRelation = await ClientService.findOne({
              where: {
                clientId: client.id,
                servicioId: serviceId
              }
            });
            
            if (!existingRelation) {
              await ClientService.create({
                id: uuidv4(),
                clientId: client.id,
                servicioId: serviceId,
                notas: serviceData.nota || '',
              });
              clientServicesCreated++;
            } else {
              // Update the notes if needed
              if (existingRelation.notas !== (serviceData.nota || '')) {
                await existingRelation.update({
                  notas: serviceData.nota || ''
                });
              }
            }
          }
        }
      }
    }
    
    console.log('\n--- Seed Summary ---');
    console.log(`Created ${clientsCreated} clients`);
    console.log(`Created ${salespersonsCreated} salespersons`);
    console.log(`Created ${techniciansCreated} technicians`);
    console.log(`Created ${servicesCreated} services`);
    console.log(`Created ${clientServicesCreated} client-service relationships`);
    console.log('');
    console.log('Unique categories:', Array.from(categories));
    console.log('Unique service names:', Array.from(serviceNames));
    
    console.log('\nDatabase seed process completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    await db.sequelize.close();
  }
}

// Run the seed function
seedDatabase();