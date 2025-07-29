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
    
    // Get all the objectives from the database to match names to IDs
    const objectives = await queryInterface.sequelize.query(
      'SELECT id, name FROM "QuantitativeObjective"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    // Get all salespersons from the database to match names to IDs
    const salespersons = await queryInterface.sequelize.query(
      'SELECT id, nombre FROM "Salesperson"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    // Create a mapping of objective names to IDs
    const objectiveMap = {};
    objectives.forEach(obj => {
      objectiveMap[obj.name] = obj.id;
    });
    
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
    
    // Current date for created/updated timestamps
    const now = new Date();
    
    // Prepare salesperson-objective assignments
    const assignments = [];
    
    objectivesData.filter(obj => obj.name).forEach(obj => {
      const objectiveId = objectiveMap[obj.name];
      if (!objectiveId) {
        console.log(`Objective not found: ${obj.name}`);
        return;
      }
      
      // Process per_salesperson assignments
      Object.entries(obj.per_salesperson || {}).forEach(([salespersonName, target]) => {
        // Try to find the salesperson by name (case-insensitive)
        const salespersonId = salespersonMap[salespersonName.toLowerCase()];
        if (!salespersonId) {
          console.log(`Salesperson not found: ${salespersonName}`);
          return; // Skip this assignment
        }
        
        assignments.push({
          id: uuidv4(),
          salespersonId,
          quantitativeObjectiveId: objectiveId,
          individualTarget: target,
          monthlyProgress: JSON.stringify({}), // Ensure this is valid JSON
          currentValue: 0,
          status: 'pending',
          createdAt: now,
          updatedAt: now
        });
      });
    });
    
    if (assignments.length === 0) {
      console.log('No valid assignments found');
      return Promise.resolve();
    }
    
    // Insert the assignments into the database
    return queryInterface.bulkInsert('SalespersonQuantitativeObjective', assignments);
  },

  async down(queryInterface, Sequelize) {
    // Delete all assignments created by this seeder
    return queryInterface.bulkDelete('SalespersonQuantitativeObjective', null, {});
  }
};
