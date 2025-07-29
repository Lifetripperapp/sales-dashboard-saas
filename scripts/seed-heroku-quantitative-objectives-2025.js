/**
 * UYTECH Sales Dashboard - Deploy 2025 Quantitative Objectives to Heroku
 * This script seeds only the 2025 quantitative objectives to Heroku
 * without affecting other data in the database
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../sequelize.config');

// Get production database configuration
const dbConfig = config.production;

// Connect to Heroku PostgreSQL
const sequelize = new Sequelize(dbConfig.url, {
  ...dbConfig,
  dialectOptions: {
    ssl: false
  },
  logging: false, // Disable logging for cleaner output
});

// Main function to deploy objectives
async function deployObjectives2025() {
  try {
    console.log('🔄 Connecting to Heroku PostgreSQL database...');
    await sequelize.authenticate();
    console.log('✅ Connection established successfully.');
    
    // Read the objectives from the JSON file
    const objectivesFilePath = path.resolve(__dirname, '../.cursor/rules/Cauntitative_objetives_2025_from_table.json');
    const objectivesData = JSON.parse(fs.readFileSync(objectivesFilePath, 'utf8'));

    // Current date for created/updated timestamps
    const now = new Date();
    
    // Start and end dates for 2025 objectives
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    
    // Map the data to the QuantitativeObjective model format
    const objectives = objectivesData.map(obj => {
      // Convert type string to lowercase to match the enum
      let dbType;
      if (obj.type === 'Currency') {
        dbType = 'currency';
      } else if (obj.type === 'Percentage') {
        dbType = 'percentage';
      } else if (obj.type === 'Number') {
        dbType = 'number';
      } else {
        // Default to number if no valid type
        dbType = 'number';
      }

      return {
        id: uuidv4(),
        name: obj.name,
        description: obj.description,
        type: dbType,
        companyTarget: obj.target_2025 || 0,
        minimumAcceptable: obj.target_2025 * 0.7, // 70% of target as minimum
        weight: obj.weight || 0,
        startDate,
        endDate,
        status: 'pending',
        isGlobal: true, // All company objectives are global
        createdAt: now,
        updatedAt: now,
        per_salesperson: obj.per_salesperson || {} // Keep this for the next step
      };
    });

    // Remove any undefined entries
    const validObjectives = objectives.filter(obj => obj.name);
    
    // Get all salespersons from the database to match names to IDs
    console.log('🔄 Fetching salespersons from Heroku database...');
    const salespersons = await sequelize.query(
      'SELECT id, nombre FROM "Salesperson"',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`📊 Found ${salespersons.length} salespersons in the database`);
    
    // Create a mapping of salesperson names to IDs with some name variations
    const salespersonMap = {};
    salespersons.forEach(sp => {
      // Convert to lowercase to make matching case-insensitive
      salespersonMap[sp.nombre.toLowerCase()] = sp.id;
      
      // Add variations of names
      if (sp.nombre === 'Juan Manuel Tato') {
        salespersonMap['manuel tato'] = sp.id;
      }
      
      if (sp.nombre === 'Shirley Roche') {
        salespersonMap['shirley roche'] = sp.id;
      }
    });
    
    // Insert objectives and get their IDs
    console.log('🔄 Inserting quantitative objectives...');
    const objectiveIds = [];
    
    for (const objective of validObjectives) {
      // Save the per_salesperson data and remove it before inserting
      const perSalesperson = objective.per_salesperson;
      delete objective.per_salesperson;
      
      try {
        const [result] = await sequelize.query(
          `INSERT INTO "QuantitativeObjective" 
           (id, name, description, type, "companyTarget", "minimumAcceptable", weight, 
            "startDate", "endDate", status, "isGlobal", "createdAt", "updatedAt") 
           VALUES 
           (:id, :name, :description, :type, :companyTarget, :minimumAcceptable, :weight, 
            :startDate, :endDate, :status, :isGlobal, :createdAt, :updatedAt) 
           RETURNING id`,
          { 
            replacements: {
              ...objective,
              startDate: objective.startDate.toISOString().split('T')[0],
              endDate: objective.endDate.toISOString().split('T')[0]
            }
          }
        );
        
        console.log(`✅ Inserted objective: ${objective.name}`);
        
        // Store the objective ID and its per_salesperson data for assignment
        objectiveIds.push({
          id: objective.id,
          name: objective.name,
          perSalesperson
        });
      } catch (error) {
        console.error(`❌ Error inserting objective ${objective.name}:`, error.message);
      }
    }
    
    // Assign objectives to salespersons
    console.log('🔄 Assigning objectives to salespersons...');
    let assignmentCount = 0;
    
    for (const objective of objectiveIds) {
      const { id: objectiveId, name: objectiveName, perSalesperson } = objective;
      
      // Skip if no per_salesperson data
      if (!perSalesperson || Object.keys(perSalesperson).length === 0) {
        console.log(`ℹ️ No salesperson assignments for: ${objectiveName}`);
        continue;
      }
      
      // Process assignments
      for (const [salespersonName, individualTarget] of Object.entries(perSalesperson)) {
        // Try to find the salesperson by name (case-insensitive)
        const salespersonId = salespersonMap[salespersonName.toLowerCase()];
        if (!salespersonId) {
          console.log(`❓ Salesperson not found: ${salespersonName}`);
          continue;
        }
        
        // Create assignment
        try {
          const assignmentId = uuidv4();
          await sequelize.query(
            `INSERT INTO "SalespersonQuantitativeObjective" 
             (id, "salespersonId", "quantitativeObjectiveId", "individualTarget", 
              "monthlyProgress", "currentValue", status, "createdAt", "updatedAt") 
             VALUES 
             (:id, :salespersonId, :quantitativeObjectiveId, :individualTarget, 
              :monthlyProgress, :currentValue, :status, :createdAt, :updatedAt)`,
            { 
              replacements: {
                id: assignmentId,
                salespersonId,
                quantitativeObjectiveId: objectiveId,
                individualTarget,
                monthlyProgress: JSON.stringify({}),
                currentValue: 0,
                status: 'pending',
                createdAt: now,
                updatedAt: now
              }
            }
          );
          
          assignmentCount++;
          console.log(`✅ Assigned "${objectiveName}" to "${salespersonName}" with target ${individualTarget}`);
        } catch (error) {
          console.error(`❌ Error creating assignment for ${salespersonName}:`, error.message);
        }
      }
    }
    
    console.log(`\n✨ Successfully added ${objectiveIds.length} objectives and ${assignmentCount} assignments to Heroku!`);
    
  } catch (error) {
    console.error('❌ Error deploying objectives to Heroku:');
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Run the deployment
deployObjectives2025(); 