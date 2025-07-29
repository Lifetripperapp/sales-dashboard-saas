'use strict';
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
        updatedAt: now
      };
    });

    // Remove any undefined entries
    const validObjectives = objectives.filter(obj => obj.name);
    
    // Insert the objectives into the database
    return queryInterface.bulkInsert('QuantitativeObjective', validObjectives);
  },

  async down(queryInterface, Sequelize) {
    // Delete all records created by this seeder
    return queryInterface.bulkDelete('QuantitativeObjective', null, {});
  }
};
