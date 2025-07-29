'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalespersonQuantitativeObjective extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Belongs to Salesperson
      SalespersonQuantitativeObjective.belongsTo(models.Salesperson, {
        foreignKey: 'salespersonId',
        as: 'salesperson'
      });

      // Belongs to QuantitativeObjective
      SalespersonQuantitativeObjective.belongsTo(models.QuantitativeObjective, {
        foreignKey: 'quantitativeObjectiveId',
        as: 'quantitativeObjective'
      });
    }
  }

  SalespersonQuantitativeObjective.init({
    // UUID as primary key
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    // Foreign key to Salesperson
    salespersonId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Salesperson',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    // Foreign key to QuantitativeObjective
    quantitativeObjectiveId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'QuantitativeObjective',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    // Individual target value for this salesperson
    individualTarget: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Monthly progress stored as JSONB for flexibility
    monthlyProgress: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Structured as: { "01": value, "02": value, ... }'
    },
    // Current YTD value (sum of monthly progress)
    currentValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    // Status of the objective for this salesperson
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'not_completed'),
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'SalespersonQuantitativeObjective',
    tableName: 'SalespersonQuantitativeObjective',
    underscored: false,
    // Log model queries during development
    logging: console.log
  });

  return SalespersonQuantitativeObjective;
}; 