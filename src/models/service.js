'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A Service can be linked to many Clients through ClientService
      Service.hasMany(models.ClientService, { 
        foreignKey: 'servicioId',
        as: 'clientServices',
        onDelete: 'CASCADE'
      });
      
      // Many-to-many relationship with Client
      Service.belongsToMany(models.Client, {
        through: models.ClientService,
        foreignKey: 'servicioId',
        otherKey: 'clientId',
        as: 'clients'
      });
    }
  }
  
  Service.init({
    // UUID as primary key
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    // Name of the service
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    // Service category
    categoria: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    // Service description
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Service',
    tableName: 'Service',
    underscored: false,
    // Log model queries during development
    logging: console.log
  });
  
  return Service;
}; 