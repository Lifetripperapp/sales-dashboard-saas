'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalespersonObjective extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A SalespersonObjective belongs to a Salesperson
      SalespersonObjective.belongsTo(models.Salesperson, {
        foreignKey: 'salespersonId',
      });
      
      // A SalespersonObjective belongs to a QualitativeObjective
      SalespersonObjective.belongsTo(models.QualitativeObjective, {
        foreignKey: 'qualitativeObjectiveId',
      });
    }
  }
  
  SalespersonObjective.init({
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
      }
    },
    // Foreign key to QualitativeObjective
    qualitativeObjectiveId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'QualitativeObjective',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'SalespersonObjective',
    tableName: 'SalespersonObjective',
    underscored: false,
    // Log model queries during development
    logging: console.log,
    // Add unique constraint to prevent duplicate assignments
    indexes: [
      {
        unique: true,
        fields: ['salespersonId', 'qualitativeObjectiveId']
      }
    ]
  });
  
  return SalespersonObjective;
}; 