'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Technician extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A Technician can have many Clients
      Technician.hasMany(models.Client, { 
        foreignKey: 'tecnicoId',
        as: 'clients',
        onDelete: 'SET NULL'
      });
      
      // A Technician can have many objectives
      Technician.hasMany(models.TechnicianObjective, {
        foreignKey: 'technicianId',
        as: 'objectives',
        onDelete: 'CASCADE'
      });
      
      // A Technician can have many evaluations
      Technician.hasMany(models.TechnicianEvaluation, {
        foreignKey: 'technicianId',
        as: 'evaluations',
        onDelete: 'CASCADE'
      });
    }
  }

  Technician.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      telefono: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      especialidad: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      estado: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      notas: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Technician',
      tableName: 'Technician',
      timestamps: true,
    }
  );

  return Technician;
}; 