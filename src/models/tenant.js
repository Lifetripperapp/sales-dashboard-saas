'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tenant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A Tenant can have many TenantUsers
      Tenant.hasMany(models.TenantUser, {
        foreignKey: 'tenantId',
        as: 'users'
      });

      // A Tenant can have many Clients
      Tenant.hasMany(models.Client, {
        foreignKey: 'tenantId',
        as: 'clients'
      });

      // A Tenant can have many Salespersons
      Tenant.hasMany(models.Salesperson, {
        foreignKey: 'tenantId',
        as: 'salespersons'
      });

      // A Tenant can have many Services
      Tenant.hasMany(models.Service, {
        foreignKey: 'tenantId',
        as: 'services'
      });

      // A Tenant can have many Objectives
      Tenant.hasMany(models.QualitativeObjective, {
        foreignKey: 'tenantId',
        as: 'qualitativeObjectives'
      });

      Tenant.hasMany(models.QuantitativeObjective, {
        foreignKey: 'tenantId',
        as: 'quantitativeObjectives'
      });

      // A Tenant can have many Technicians
      Tenant.hasMany(models.Technician, {
        foreignKey: 'tenantId',
        as: 'technicians'
      });
    }
  }
  
  Tenant.init({
    // UUID as primary key
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    // Name of the company/tenant
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    // Custom domain (optional)
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isUrl: true
      }
    },
    // Subscription plan
    plan: {
      type: DataTypes.ENUM('free', 'basic', 'premium'),
      allowNull: false,
      defaultValue: 'free'
    },
    // Maximum number of users allowed
    maxUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: 1
      }
    },
    // Maximum number of clients allowed
    maxClients: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 1
      }
    },
    // Enabled features for this tenant
    features: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        objectives: true,
        clientMatrix: true,
        dashboard: true,
        reports: false,
        api: false,
        customBranding: false
      }
    },
    // Tenant-specific settings
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        timezone: 'America/Montevideo',
        currency: 'UYU',
        language: 'es',
        dateFormat: 'DD/MM/YYYY'
      }
    },
    // Tenant status
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'Tenant',
    tableName: 'Tenant',
    underscored: false,
    // Log model queries during development
    logging: console.log
  });
  
  return Tenant;
}; 