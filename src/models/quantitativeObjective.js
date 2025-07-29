'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class QuantitativeObjective extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Many-to-many relationship with Salesperson through SalespersonQuantitativeObjective
      QuantitativeObjective.belongsToMany(models.Salesperson, {
        through: models.SalespersonQuantitativeObjective,
        foreignKey: 'quantitativeObjectiveId',
        otherKey: 'salespersonId',
        as: 'salespersons'
      });
      
      // A QuantitativeObjective can be based on a Template
      QuantitativeObjective.belongsTo(models.QuantitativeObjectiveTemplate, {
        foreignKey: 'templateId',
        as: 'template'
      });
    }
  }
  
  QuantitativeObjective.init({
    // UUID as primary key
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    // Name of the objective
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    // Description of the objective
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Type of objective: currency, percentage, or number
    type: {
      type: DataTypes.ENUM('currency', 'percentage', 'number'),
      allowNull: false
    },
    // Company-wide target value
    companyTarget: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    // Minimum acceptable value
    minimumAcceptable: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    // Weight of the objective in overall evaluation (0-1)
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      }
    },
    // Start date of the objective
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // End date of the objective
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // Status of the objective
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'not_completed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    // Whether this is a global objective
    isGlobal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // Foreign key to QuantitativeObjectiveTemplate
    templateId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'QuantitativeObjectiveTemplate',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'QuantitativeObjective',
    tableName: 'QuantitativeObjective',
    underscored: false,
    // Log model queries during development
    logging: console.log
  });
  
  return QuantitativeObjective;
}; 