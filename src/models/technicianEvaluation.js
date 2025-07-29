'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TechnicianEvaluation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // An evaluation belongs to a Technician
      TechnicianEvaluation.belongsTo(models.Technician, {
        foreignKey: 'technicianId',
        as: 'technician',
        onDelete: 'CASCADE'
      });
    }
  }
  
  TechnicianEvaluation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    technicianId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Technician',
        key: 'id'
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2000,
        max: 2100
      }
    },
    semester: {
      type: DataTypes.ENUM('H1', 'H2'),
      allowNull: false
    },
    evaluationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('draft', 'final'),
      allowNull: false,
      defaultValue: 'draft'
    },
    // Quality & Productivity scores
    qualityAccuracy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    qualityOutputQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    qualityOrganization: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    qualityUseOfTools: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    // Knowledge scores
    knowledgeTechnicalSkill: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    knowledgeMethods: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    knowledgeTools: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    knowledgeAutonomy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    knowledgeTraining: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    // Commitment scores
    commitmentCollaboration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    commitmentCommunication: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    commitmentProactivity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    commitmentPunctuality: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    commitmentMotivation: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    // Attitude scores
    attitudeOpenness: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    attitudeAdaptability: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    attitudeImprovement: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    // Values scores
    valuesHonesty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    valuesResponsibility: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    // Overall rating
    overallRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 6
      }
    },
    // Comments
    supervisorComments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    employeeComments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Previous objectives and their completion status
    previousObjectives: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    // Next objectives
    nextObjectives: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    // Calculated bonus percentage
    bonusPercentage: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TechnicianEvaluation',
    tableName: 'TechnicianEvaluation',
    underscored: false,
    // Log model queries during development
    logging: console.log
  });
  
  return TechnicianEvaluation;
}; 