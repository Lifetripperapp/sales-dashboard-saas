/**
 * UYTECH Sales Dashboard - Data Extraction Script
 * Extracts data from local database and creates seed files
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('../sequelize.config');

// Get database configuration
const dbConfig = config.development;

// Connect to the database
const sequelize = new Sequelize(dbConfig.url, {
  ...dbConfig,
  logging: false, // Disable logging for cleaner output
});

// Define the tables to extract
const tables = [
  'Salesperson',
  'Technician',
  'Service',
  'Client',
  'ClientService',
  'QualitativeObjective',
  'SalespersonObjective',
  'QuantitativeObjectiveTemplate',
  'QuantitativeObjective',
  'SalespersonQuantitativeObjective'
];

// Helper function to format date for seed files
const formatDate = (date) => {
  if (!date) return null;
  if (typeof date === 'string') return `'${date}'`;
  return `'${date.toISOString()}'`;
};

// Helper to sanitize string values for JavaScript
const sanitizeString = (str) => {
  if (str === null || str === undefined) return 'null';
  return `'${String(str).replace(/'/g, "\\'").replace(/\n/g, "\\n")}'`;
};

// Helper to format value based on its type
const formatValue = (value, isDate = false) => {
  if (value === null || value === undefined) return 'null';
  if (isDate) return formatDate(value);
  if (typeof value === 'string') return sanitizeString(value);
  if (typeof value === 'boolean') return value;
  return value;
};

// Generate a seed file for a table
const generateSeedFile = (tableName, data) => {
  if (!data || data.length === 0) {
    console.log(`No data found for ${tableName}, skipping seed file generation`);
    return;
  }

  console.log(`Generating seed file for ${tableName} with ${data.length} records`);

  // Create the seed file content
  let seedContent = `'use strict';

/**
 * Generated Seed File - ${tableName}
 * Generated on ${new Date().toISOString()}
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('${tableName}', [\n`;

  // Add each record
  data.forEach((record, index) => {
    seedContent += '      {\n';
    
    // Add each field
    Object.keys(record).forEach(field => {
      const value = record[field];
      
      // Skip Sequelize virtual fields
      if (field.startsWith('_')) return;
      
      // Skip clientCount/etc fields that might be generated
      if (field.endsWith('Count')) return;
      
      // Format field values appropriately
      const isDate = field === 'createdAt' || field === 'updatedAt' || field.toLowerCase().includes('date');
      seedContent += `        ${field}: ${formatValue(value, isDate)},\n`;
    });
    
    seedContent += '      }' + (index < data.length - 1 ? ',' : '') + '\n';
  });

  seedContent += `    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('${tableName}', null, {});
  }
};`;

  // Write the seed file
  const timestamp = Math.floor(Date.now() / 1000);
  const filename = path.join(__dirname, '..', 'seeders', `${timestamp}-${tableName.toLowerCase()}.js`);
  fs.writeFileSync(filename, seedContent);
  console.log(`Created seed file: ${filename}`);
};

// Create base migration file for table
const generateBaseMigration = (tableName, data) => {
  if (!data || data.length === 0) {
    console.log(`No data found for ${tableName}, skipping migration file generation`);
    return;
  }

  // Get a sample record to infer schema
  const sample = data[0];
  console.log(`Generating migration file for ${tableName}`);
  
  // Define field type mapping
  const getFieldType = (fieldName, value) => {
    if (value === null || value === undefined) return 'Sequelize.STRING';
    
    if (fieldName === 'id') return 'Sequelize.UUID';
    if (fieldName === 'createdAt' || fieldName === 'updatedAt' || fieldName.toLowerCase().includes('date')) 
      return 'Sequelize.DATE';
    
    switch (typeof value) {
      case 'string': return 'Sequelize.STRING';
      case 'number': 
        return Number.isInteger(value) ? 'Sequelize.INTEGER' : 'Sequelize.FLOAT';
      case 'boolean': return 'Sequelize.BOOLEAN';
      default: return 'Sequelize.STRING';
    }
  };
  
  // Create the migration file content
  let migrationContent = `'use strict';

/**
 * Generated Migration File - ${tableName}
 * Generated on ${new Date().toISOString()}
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('${tableName}', {
`;

  // Add each field with inferred type
  Object.keys(sample).forEach(field => {
    // Skip Sequelize virtual fields
    if (field.startsWith('_')) return;
    
    // Skip clientCount/etc fields that might be generated
    if (field.endsWith('Count')) return;
    
    const value = sample[field];
    const fieldType = getFieldType(field, value);
    
    migrationContent += `      ${field}: {
        type: ${fieldType},`;
        
    // Add special handling for id field
    if (field === 'id') {
      migrationContent += `
        primaryKey: true,
        allowNull: false,`;
    }
    
    migrationContent += `
      },
`;
  });

  migrationContent += `    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('${tableName}');
  }
};`;

  // Write the migration file
  const timestamp = Math.floor(Date.now() / 1000);
  const filename = path.join(__dirname, '..', 'migrations', `${timestamp}-create-${tableName.toLowerCase()}.js`);
  fs.writeFileSync(filename, migrationContent);
  console.log(`Created migration file: ${filename}`);
};

// Main function to extract data and generate files
async function extractData() {
  try {
    console.log('🔄 Connecting to local database...');
    await sequelize.authenticate();
    console.log('✅ Connection established successfully.');

    // Ensure directories exist
    const seedersDir = path.join(__dirname, '..', 'seeders');
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    
    if (!fs.existsSync(seedersDir)) {
      fs.mkdirSync(seedersDir, { recursive: true });
    }
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // Create a backup of the data
    const backupDir = path.join(__dirname, 'backup', Date.now().toString());
    fs.mkdirSync(backupDir, { recursive: true });

    // Extract data for each table and generate seed files
    for (const table of tables) {
      console.log(`\n🔄 Processing table: ${table}`);
      
      try {
        // Extract all data from the table
        const query = `SELECT * FROM "${table}"`;
        const [results] = await sequelize.query(query);
        
        // If no results, skip this table
        if (results.length === 0) {
          console.log(`No data found in table ${table}, skipping...`);
          continue;
        }
        
        // Create a backup of the data
        const backupFilePath = path.join(backupDir, `${table}.json`);
        fs.writeFileSync(backupFilePath, JSON.stringify(results, null, 2));
        console.log(`Backup created at ${backupFilePath}`);
        
        // Generate seed and migration files
        generateSeedFile(table, results);
        generateBaseMigration(table, results);
      } catch (error) {
        console.error(`❌ Error processing table ${table}:`, error.message);
      }
    }

    console.log('\n✨ Data extraction completed successfully!');
    console.log('✨ Seed files and migrations have been created.');
  } catch (error) {
    console.error('❌ Error extracting data:');
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Run the data extraction
extractData(); 