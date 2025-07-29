/**
 * UYTECH Sales Dashboard - Database Data Check Script
 * Script to check all tables in the database and count records
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const config = require('../sequelize.config');

// Use development configuration
const dbConfig = config.development;
const sequelize = new Sequelize(dbConfig.url, dbConfig);

async function checkDatabase() {
  try {
    console.log('🔄 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Get all table names
    const tables = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (tables.length === 0) {
      console.log('❌ No tables found in the database.');
      return;
    }
    
    console.log(`Found ${tables.length} tables in the database.`);
    
    // Check each table for data
    let totalRecords = 0;
    
    for (const table of tables) {
      const tableName = table.tablename;
      
      // Count records
      const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`, {
        type: Sequelize.QueryTypes.SELECT
      });
      
      const count = parseInt(result.count, 10);
      totalRecords += count;
      
      console.log(`Table "${tableName}": ${count} records`);
      
      // If table has data, show a sample
      if (count > 0) {
        const sampleSize = Math.min(count, 3);
        const sample = await sequelize.query(`SELECT * FROM "${tableName}" LIMIT ${sampleSize}`, {
          type: Sequelize.QueryTypes.SELECT
        });
        
        console.log(`Sample data from "${tableName}":`);
        console.log(JSON.stringify(sample, null, 2));
      }
    }
    
    console.log(`\n📊 Database Summary:`);
    console.log(`Total tables: ${tables.length}`);
    console.log(`Total records across all tables: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('✅ Database is empty - all data has been successfully deleted.');
    } else {
      console.log('⚠️ Database still contains data.');
    }
  } catch (error) {
    console.error('❌ Error checking database:');
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkDatabase(); 