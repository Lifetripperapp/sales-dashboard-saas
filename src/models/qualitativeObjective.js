'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class QualitativeObjective extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Many-to-many relationship with Salespersons through SalespersonObjective
      QualitativeObjective.belongsToMany(models.Salesperson, {
        through: models.SalespersonObjective,
        foreignKey: 'qualitativeObjectiveId',
        otherKey: 'salespersonId',
        as: 'assignedSalespersons'
      });
    }
  }
  
  QualitativeObjective.init({
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
    // Success criteria for the objective
    criteria: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Status of the objective
    status: {
      type: DataTypes.ENUM('pendiente', 'en_progreso', 'completado', 'no_completado'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    // Due date for the objective
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Date when the objective was completed
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Weight of the objective in overall evaluation
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    // Comments about the objective's progress
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Link to evidence of completion
    evidence: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Whether this is a global objective
    isGlobal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'QualitativeObjective',
    tableName: 'QualitativeObjective',
    underscored: false,
    // Log model queries during development
    logging: console.log
  });
  
  return QualitativeObjective;
}; 