'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TechnicianObjective extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A TechnicianObjective belongs to a Technician
      TechnicianObjective.belongsTo(models.Technician, {
        foreignKey: 'technicianId',
        as: 'technician',
        onDelete: 'CASCADE'
      });
    }
  }

  TechnicianObjective.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      technicianId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Technician',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      criteria: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Success criteria for the objective',
      },
      status: {
        type: DataTypes.ENUM('pendiente', 'en_progreso', 'completado', 'no_completado'),
        allowNull: false,
        defaultValue: 'pendiente',
        comment: 'Current status of the objective',
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completionDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when the objective was completed',
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
      },
      weight: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
        comment: 'Weight of the objective in overall evaluation (0-100)',
      },
      evidence: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Link or reference to evidence of completion',
      },
      isNextObjective: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'True for next period objectives, false for previous objectives',
      },
      isGlobal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this is a global objective for all technicians',
      },
    },
    {
      sequelize,
      modelName: 'TechnicianObjective',
      tableName: 'TechnicianObjective',
      underscored: false,
      timestamps: true,
      indexes: [
        {
          fields: ['technicianId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['is_next_objective'],
        },
        {
          fields: ['is_global'],
        },
      ],
    }
  );

  return TechnicianObjective;
}; 