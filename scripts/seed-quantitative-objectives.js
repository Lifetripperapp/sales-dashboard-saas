/**
 * UYTECH Sales Dashboard - Seed Quantitative Objectives Script
 * Script to seed quantitative objectives and associated data in Heroku PostgreSQL
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
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

async function seedQuantitativeObjectives() {
  try {
    console.log('Creating sample quantitative objectives...');
    
    // Create 3 quantitative objectives
    const objectiveIds = [];
    
    // Objective 1: Annual Sales Target
    const obj1Id = uuidv4();
    objectiveIds.push(obj1Id);
    
    await sequelize.query(`
      INSERT INTO "QuantitativeObjective" (
        "id", "name", "description", "type", "companyTarget", "minimumAcceptable",
        "weight", "isGlobal", "startDate", "endDate", "status", "createdAt", "updatedAt"
      ) VALUES (
        '${obj1Id}', 
        'Annual Sales Target', 
        'Total annual sales target for the year', 
        'currency', 
        850000.00, 
        700000.00,
        40, 
        true, 
        CURRENT_DATE, 
        (CURRENT_DATE + INTERVAL '1 year')::date,
        'pending',
        NOW(), 
        NOW()
      );
    `);
    
    // Objective 2: Client Acquisition
    const obj2Id = uuidv4();
    objectiveIds.push(obj2Id);
    
    await sequelize.query(`
      INSERT INTO "QuantitativeObjective" (
        "id", "name", "description", "type", "companyTarget", "minimumAcceptable",
        "weight", "isGlobal", "startDate", "endDate", "status", "createdAt", "updatedAt"
      ) VALUES (
        '${obj2Id}', 
        'New Clients', 
        'Number of new clients acquired', 
        'number', 
        25, 
        20,
        30, 
        true, 
        CURRENT_DATE, 
        (CURRENT_DATE + INTERVAL '1 year')::date,
        'pending',
        NOW(), 
        NOW()
      );
    `);
    
    // Objective 3: Gross Margin Percentage
    const obj3Id = uuidv4();
    objectiveIds.push(obj3Id);
    
    await sequelize.query(`
      INSERT INTO "QuantitativeObjective" (
        "id", "name", "description", "type", "companyTarget", "minimumAcceptable",
        "weight", "isGlobal", "startDate", "endDate", "status", "createdAt", "updatedAt"
      ) VALUES (
        '${obj3Id}', 
        'Gross Margin', 
        'Average gross margin percentage', 
        'percentage', 
        25.00, 
        20.00,
        30, 
        true, 
        CURRENT_DATE, 
        (CURRENT_DATE + INTERVAL '1 year')::date,
        'pending',
        NOW(), 
        NOW()
      );
    `);
    
    console.log('✅ Quantitative objectives created successfully');
    
    // Get all active salespersons
    console.log('Fetching active salespersons...');
    const salespersonsResult = await sequelize.query(`
      SELECT id FROM "Salesperson" WHERE estado = 'active';
    `, { type: Sequelize.QueryTypes.SELECT });
    
    const salespersonIds = salespersonsResult.map(s => s.id);
    console.log(`Found ${salespersonIds.length} active salespersons`);
    
    // Assign objectives to salespersons
    console.log('Assigning objectives to salespersons...');
    
    for (const salespersonId of salespersonIds) {
      for (const objectiveId of objectiveIds) {
        const id = uuidv4();
        
        // Determine individualTarget based on objectiveId
        let individualTarget = 0;
        let currentValue = 0;
        
        if (objectiveId === obj1Id) {
          // Sales target varies by salesperson
          individualTarget = Math.round(80000 + Math.random() * 40000);
          currentValue = Math.round(individualTarget * Math.random() * 0.8);
        } else if (objectiveId === obj2Id) {
          // Client acquisition target
          individualTarget = Math.round(3 + Math.random() * 5);
          currentValue = Math.round(individualTarget * Math.random());
        } else if (objectiveId === obj3Id) {
          // Gross margin target
          individualTarget = Math.round(200 + Math.random() * 100) / 10; // 20-30%
          currentValue = Math.round(individualTarget * Math.random() * 0.9);
        }
        
        await sequelize.query(`
          INSERT INTO "SalespersonQuantitativeObjective" (
            "id", "salespersonId", "quantitativeObjectiveId", 
            "individualTarget", "currentValue", "status", 
            "createdAt", "updatedAt"
          ) VALUES (
            '${id}', 
            '${salespersonId}', 
            '${objectiveId}', 
            ${individualTarget}, 
            ${currentValue}, 
            'pending',
            NOW(), 
            NOW()
          );
        `);
      }
    }
    
    console.log('✅ Objectives assigned to salespersons successfully');
    
  } catch (error) {
    console.error('Error seeding quantitative objectives:', error.message);
  }
}

async function seedData() {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection to Heroku PostgreSQL established successfully.');

    await seedQuantitativeObjectives();

    console.log('✨ Data seeding operation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedData(); 