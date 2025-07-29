const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Setup script for Supabase database
 */
async function setupSupabase() {
  console.log('🚀 Setting up Supabase database...');

  // Create Sequelize instance for Supabase
  const sequelize = new Sequelize(process.env.SUPABASE_DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Connected to Supabase database');

    // Import models
    const db = require('../src/models');
    
    // Sync all models
    console.log('📊 Syncing database models...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synced');

    // Create default tenant for testing
    console.log('🏢 Creating default tenant...');
    const { Tenant, TenantUser } = db;
    
    const defaultTenant = await Tenant.create({
      name: 'UYTECH Demo',
      plan: 'free',
      status: 'active',
      features: {
        objectives: true,
        clientMatrix: true,
        dashboard: true,
        reports: false,
        api: false,
        customBranding: false
      },
      settings: {
        timezone: 'America/Montevideo',
        currency: 'UYU',
        language: 'es',
        dateFormat: 'DD/MM/YYYY'
      }
    });

    console.log(`✅ Default tenant created: ${defaultTenant.id}`);

    // Create sample data
    console.log('📝 Creating sample data...');
    
    // Create sample salesperson
    const salesperson = await db.Salesperson.create({
      nombre: 'Juan Pérez',
      email: 'juan.perez@demo.com',
      estado: 'active',
      tenantId: defaultTenant.id
    });

    // Create sample client
    const client = await db.Client.create({
      nombre: 'Cliente Demo',
      contratoSoporte: true,
      fechaUltimoRelevamiento: new Date(),
      vendedorId: salesperson.id,
      tenantId: defaultTenant.id
    });

    // Create sample service
    const service = await db.Service.create({
      nombre: 'Servicio Demo',
      descripcion: 'Descripción del servicio demo',
      categoria: 'Software',
      tenantId: defaultTenant.id
    });

    // Create sample objective
    const objective = await db.QualitativeObjective.create({
      titulo: 'Objetivo Demo',
      descripcion: 'Descripción del objetivo demo',
      estado: 'pendiente',
      prioridad: 'alta',
      fechaLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      tenantId: defaultTenant.id
    });

    console.log('✅ Sample data created');

    console.log('\n🎉 Supabase setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Database: ${process.env.SUPABASE_DATABASE_URL.split('@')[1]?.split('/')[0] || 'Connected'}`);
    console.log(`- Default Tenant ID: ${defaultTenant.id}`);
    console.log(`- Sample Salesperson: ${salesperson.nombre}`);
    console.log(`- Sample Client: ${client.nombre}`);
    console.log(`- Sample Service: ${service.nombre}`);
    console.log(`- Sample Objective: ${objective.titulo}`);

  } catch (error) {
    console.error('❌ Error setting up Supabase:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

/**
 * Migration script for existing data
 */
async function migrateExistingData() {
  console.log('🔄 Migrating existing data to multi-tenant structure...');

  const sequelize = new Sequelize(process.env.SUPABASE_DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to Supabase database');

    const db = require('../src/models');
    
    // Create default tenant for existing data
    const defaultTenant = await db.Tenant.create({
      name: 'UYTECH Legacy',
      plan: 'free',
      status: 'active'
    });

    console.log(`✅ Created default tenant: ${defaultTenant.id}`);

    // Update existing records with tenantId
    const tables = [
      'Client',
      'Salesperson', 
      'Service',
      'ClientService',
      'QualitativeObjective',
      'QuantitativeObjective',
      'SalespersonObjective',
      'SalespersonQuantitativeObjective',
      'Technician',
      'TechnicianEvaluation',
      'TechnicianObjective',
      'QuantitativeObjectiveTemplate'
    ];

    for (const tableName of tables) {
      const Model = db[tableName];
      if (Model) {
        const count = await Model.count();
        if (count > 0) {
          await Model.update(
            { tenantId: defaultTenant.id },
            { where: { tenantId: null } }
          );
          console.log(`✅ Updated ${count} records in ${tableName}`);
        }
      }
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error migrating data:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      setupSupabase();
      break;
    case 'migrate':
      migrateExistingData();
      break;
    default:
      console.log('Usage: node supabase-setup.js [setup|migrate]');
      console.log('  setup   - Initial Supabase setup with sample data');
      console.log('  migrate - Migrate existing data to multi-tenant structure');
  }
}

module.exports = {
  setupSupabase,
  migrateExistingData
}; 