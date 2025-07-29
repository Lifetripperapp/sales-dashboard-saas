/**
 * UYTECH Sales Dashboard - Cleanup Duplicate Objectives Script
 * Script to clean up any duplicate objectives and fix issues in Heroku PostgreSQL
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
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

async function cleanupDuplicateObjectives() {
  try {
    console.log('Checking for duplicate quantitative objectives...');
    
    // Find duplicate objectives by name
    const duplicatesResult = await sequelize.query(`
      SELECT name, COUNT(*) as count
      FROM "QuantitativeObjective"
      GROUP BY name
      HAVING COUNT(*) > 1;
    `, { type: Sequelize.QueryTypes.SELECT });
    
    if (duplicatesResult.length === 0) {
      console.log('✅ No duplicate objectives found');
      return;
    }
    
    console.log(`Found ${duplicatesResult.length} duplicate objective names:`);
    console.log(duplicatesResult);
    
    // For each duplicate name, keep the one with assigned salespersons and delete others
    for (const duplicate of duplicatesResult) {
      const { name } = duplicate;
      
      console.log(`Processing duplicates for objective: ${name}`);
      
      // Find all objectives with this name
      const objectives = await sequelize.query(`
        SELECT o.id, o.name, COUNT(s.id) as assigned_count
        FROM "QuantitativeObjective" o
        LEFT JOIN "SalespersonQuantitativeObjective" s ON o.id = s."quantitativeObjectiveId"
        WHERE o.name = '${name}'
        GROUP BY o.id, o.name
        ORDER BY COUNT(s.id) DESC;
      `, { type: Sequelize.QueryTypes.SELECT });
      
      console.log(`Found ${objectives.length} objectives with name "${name}"`);
      
      if (objectives.length <= 1) {
        console.log('No duplicates to clean up');
        continue;
      }
      
      // Keep the first one (with most assignments) and delete others
      const keepObjective = objectives[0];
      console.log(`Keeping objective: ${keepObjective.id} with ${keepObjective.assigned_count} assignments`);
      
      for (let i = 1; i < objectives.length; i++) {
        const objToDelete = objectives[i];
        console.log(`Deleting objective: ${objToDelete.id} with ${objToDelete.assigned_count} assignments`);
        
        // Delete salesperson assignments first if any
        if (parseInt(objToDelete.assigned_count) > 0) {
          await sequelize.query(`
            DELETE FROM "SalespersonQuantitativeObjective" 
            WHERE "quantitativeObjectiveId" = '${objToDelete.id}';
          `);
          console.log(`Deleted ${objToDelete.assigned_count} salesperson assignments`);
        }
        
        // Delete the objective
        await sequelize.query(`
          DELETE FROM "QuantitativeObjective" 
          WHERE id = '${objToDelete.id}';
        `);
        console.log(`Deleted duplicate objective with id: ${objToDelete.id}`);
      }
    }
    
    console.log('✅ Cleanup completed successfully');
    
  } catch (error) {
    console.error('Error cleaning up duplicates:', error.message);
  }
}

async function cleanupDatabase() {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection to Heroku PostgreSQL established successfully.');

    await cleanupDuplicateObjectives();

    console.log('✨ Database cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database cleanup:');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

cleanupDatabase(); 