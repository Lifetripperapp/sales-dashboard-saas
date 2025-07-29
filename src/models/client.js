'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A Client belongs to a Salesperson (optional relationship)
      Client.belongsTo(models.Salesperson, {
        foreignKey: 'vendedorId',
        as: 'vendedor'
      });
      
      // A Client can have a Technician
      Client.belongsTo(models.Technician, {
        foreignKey: 'tecnicoId',
        as: 'tecnico'
      });
      
      // A Client can have many Services through ClientService
      Client.hasMany(models.ClientService, {
        foreignKey: 'clientId',
        as: 'clientServices',
        onDelete: 'CASCADE'
      });
      
      // Many-to-many relationship with Service
      Client.belongsToMany(models.Service, {
        through: models.ClientService,
        foreignKey: 'clientId',
        otherKey: 'servicioId',
        as: 'servicios'
      });
    }
  }
  
  Client.init({
    // UUID as primary key
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    // Name of the client
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    // Foreign key to Salesperson (optional)
    vendedorId: {
      type: DataTypes.UUID,
      allowNull: true, // Changed to true to make it optional
      references: {
        model: 'Salesperson',
        key: 'id'
      }
    },
    // Foreign key to Technician
    tecnicoId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Technician',
        key: 'id'
      }
    },
    // Whether the client has a support contract
    contratoSoporte: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // Date of the last assessment
    fechaUltimoRelevamiento: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Link to the assessment document
    linkDocumentoRelevamiento: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Pending actions stored as JSONB for flexibility
    accionesPendientes: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Structured as: [{ action: string, dueDate: date, status: string }]'
    }
  }, {
    sequelize,
    modelName: 'Client',
    tableName: 'Client',
    underscored: false,
    // Log model queries during development
    logging: console.log
  });
  
  return Client;
}; 