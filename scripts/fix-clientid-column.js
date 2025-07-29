/**
 * UYTECH Sales Dashboard - Fix ClientID Column Script
 * Script to fix the ClientService table to ensure it uses clientId instead of clienteId
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

async function checkColumns() {
  try {
    // Check existing columns in the ClientService table
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ClientService'
    `;
    const columns = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log('Current columns in ClientService table:', columns.map(c => c.column_name));
    
    const hasClienteId = columns.some(c => c.column_name === 'clienteId');
    const hasClientId = columns.some(c => c.column_name === 'clientId');
    
    return { hasClienteId, hasClientId, columns };
  } catch (error) {
    console.error('Error checking columns:', error.message);
    throw error;
  }
}

async function fixClientIdColumn() {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Connection to Heroku PostgreSQL established successfully.');
    
    const { hasClienteId, hasClientId, columns } = await checkColumns();
    
    if (hasClienteId && !hasClientId) {
      // We need to rename the column
      console.log('🔄 Renaming clienteId column to clientId...');
      await sequelize.query('ALTER TABLE "ClientService" RENAME COLUMN "clienteId" TO "clientId"');
      console.log('✅ Successfully renamed clienteId to clientId');
    } else if (hasClientId && hasClienteId) {
      // Both columns exist, need to migrate data
      console.log('🔄 Both columns exist, checking data...');
      
      const clientServices = await sequelize.query('SELECT id, "clienteId", "clientId" FROM "ClientService"', {
        type: Sequelize.QueryTypes.SELECT
      });
      
      console.log(`Found ${clientServices.length} client service records`);
      
      // Check if data needs to be migrated
      const needMigration = clientServices.some(cs => 
        (cs.clienteId && !cs.clientId) || (!cs.clienteId && cs.clientId));
      
      if (needMigration) {
        console.log('🔄 Migrating data from clienteId to clientId...');
        
        // Begin transaction
        const transaction = await sequelize.transaction();
        
        try {
          // Update records where clientId is null but clienteId has value
          await sequelize.query(`
            UPDATE "ClientService" 
            SET "clientId" = "clienteId" 
            WHERE "clientId" IS NULL AND "clienteId" IS NOT NULL
          `, { transaction });
          
          // Now we can drop the clienteId column
          await sequelize.query('ALTER TABLE "ClientService" DROP COLUMN "clienteId"', { transaction });
          
          // Commit transaction
          await transaction.commit();
          console.log('✅ Successfully migrated data and removed clienteId column');
        } catch (error) {
          await transaction.rollback();
          console.error('❌ Error during migration:', error.message);
          throw error;
        }
      } else {
        console.log('✅ No data migration needed, all records have consistent clientId values');
        
        // Still remove the clienteId column if it exists but is redundant
        try {
          await sequelize.query('ALTER TABLE "ClientService" DROP COLUMN "clienteId"');
          console.log('✅ Dropped redundant clienteId column');
        } catch (error) {
          console.error('❌ Error dropping clienteId column:', error.message);
        }
      }
    } else if (hasClientId && !hasClienteId) {
      console.log('✅ ClientService table already has the correct clientId column');
    } else {
      console.error('❌ Neither clientId nor clienteId column found in ClientService table!');
      console.log('Available columns:', columns.map(c => c.column_name).join(', '));
    }
    
    // Verify the fix
    const finalState = await checkColumns();
    console.log('Final state of columns:', finalState.columns.map(c => c.column_name));
    
    console.log('✨ ClientId column fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing clientId column:');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixClientIdColumn(); 