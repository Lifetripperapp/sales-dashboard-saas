'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ClientService extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A ClientService belongs to a Client
      ClientService.belongsTo(models.Client, {
        foreignKey: 'clientId',
        as: 'cliente'
      });
      
      // A ClientService belongs to a Service
      ClientService.belongsTo(models.Service, {
        foreignKey: 'servicioId',
        as: 'servicio'
      });
    }
  }
  
  ClientService.init({
    // UUID as primary key
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    // Foreign key to Client
    clientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Client',
        key: 'id'
      }
    },
    // Foreign key to Service
    servicioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Service',
        key: 'id'
      }
    },
    // Date when service was assigned to client
    fechaAsignacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    // Notes for the service assignment
    notas: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    // Additional details stored as JSONB for flexibility
    detalles: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Structured as: { startDate, status, notes, configurations, etc. }'
    }
  }, {
    sequelize,
    modelName: 'ClientService',
    tableName: 'ClientService',
    underscored: false,
    // Log model queries during development
    logging: console.log,
    // Ensure a client can only have a specific service once
    indexes: [
      {
        unique: true,
        fields: ['clientId', 'servicioId']
      }
    ]
  });
  
  return ClientService;
}; 