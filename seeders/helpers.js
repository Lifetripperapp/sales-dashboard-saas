'use strict';

// Helper functions for seeders

/**
 * Get all records from a table
 * @param {Object} queryInterface - Sequelize query interface
 * @param {string} tableName - Name of the table to query
 * @returns {Array} - Array of records
 */
const getRecords = async (queryInterface, tableName) => {
  try {
    const records = await queryInterface.sequelize.query(
      `SELECT * FROM "${tableName}"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    return records;
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error);
    return [];
  }
};

/**
 * Get a random record from an array
 * @param {Array} array - Array of records
 * @returns {Object} - Random record
 */
const getRandomRecord = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Get multiple random records from an array
 * @param {Array} array - Array of records
 * @param {number} count - Number of records to get
 * @param {boolean} allowDuplicates - Whether to allow duplicates
 * @returns {Array} - Array of random records
 */
const getRandomRecords = (array, count, allowDuplicates = false) => {
  if (count > array.length && !allowDuplicates) {
    count = array.length;
  }
  
  if (!allowDuplicates) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } else {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(getRandomRecord(array));
    }
    return result;
  }
};

module.exports = {
  getRecords,
  getRandomRecord,
  getRandomRecords
}; 