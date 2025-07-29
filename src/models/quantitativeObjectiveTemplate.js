'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class QuantitativeObjectiveTemplate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A Template can be linked to many QuantitativeObjectives
      QuantitativeObjectiveTemplate.hasMany(models.QuantitativeObjective, {
        foreignKey: 'templateId',
        as: 'quantitativeObjectives',
        onDelete: 'SET NULL'
      });
    }
  }
  
  QuantitativeObjectiveTemplate.init({
    // UUID as primary key
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    // Name of the template
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    // Description of the template
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Type of objective: monetary value or quantity
    type: {
      type: DataTypes.ENUM('moneda', 'cantidad'),
      allowNull: false
    },
    // Annual target value
    annual: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Monthly target value
    monthly: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Minimum target value
    minimum: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Weight of the objective in overall evaluation
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    }
  }, {
    sequelize,
    modelName: 'QuantitativeObjectiveTemplate',
    tableName: 'QuantitativeObjectiveTemplate',
    underscored: false,
    // Log model queries during development
    logging: console.log
  });
  
  return QuantitativeObjectiveTemplate;
}; 