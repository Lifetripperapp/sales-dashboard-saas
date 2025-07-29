'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Salesperson extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A Salesperson can have many Clients
      Salesperson.hasMany(models.Client, { 
        foreignKey: 'vendedorId',
        as: 'clients',
        onDelete: 'RESTRICT'
      });
      
      // Many-to-many relationship with QuantitativeObjectives through SalespersonQuantitativeObjective
      Salesperson.belongsToMany(models.QuantitativeObjective, {
        through: models.SalespersonQuantitativeObjective,
        foreignKey: 'salespersonId',
        otherKey: 'quantitativeObjectiveId',
        as: 'quantitativeObjectives'
      });
      
      // Many-to-many relationship with QualitativeObjectives through SalespersonObjective
      Salesperson.belongsToMany(models.QualitativeObjective, {
        through: models.SalespersonObjective,
        foreignKey: 'salespersonId',
        otherKey: 'qualitativeObjectiveId',
        as: 'qualitativeObjectives'
      });
    }
  }
  
  Salesperson.init({
    // UUID as primary key
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    // Full name of the Salesperson
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    // Email address (unique)
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    // Status: active or inactive
    estado: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'Salesperson',
    tableName: 'Salesperson',
    underscored: false,
    // Log model queries during development
    logging: console.log
  });
  
  return Salesperson;
}; 