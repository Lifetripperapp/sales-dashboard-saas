'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TechnicianEvaluation', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      technicianId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Technician',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      semester: {
        type: Sequelize.ENUM('H1', 'H2'),
        allowNull: false
      },
      evaluationDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      status: {
        type: Sequelize.ENUM('draft', 'final'),
        allowNull: false,
        defaultValue: 'draft'
      },
      qualityAccuracy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      qualityOutputQuantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      qualityOrganization: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      qualityUseOfTools: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      knowledgeTechnicalSkill: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      knowledgeMethods: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      knowledgeTools: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      knowledgeAutonomy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      knowledgeTraining: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      commitmentCollaboration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      commitmentCommunication: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      commitmentProactivity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      commitmentPunctuality: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      commitmentMotivation: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      attitudeOpenness: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      attitudeAdaptability: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      attitudeImprovement: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      valuesHonesty: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      valuesResponsibility: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      overallRating: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      supervisorComments: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      employeeComments: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      previousObjectives: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      nextObjectives: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      bonusPercentage: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create unique index for technician, year, and semester
    await queryInterface.addIndex('TechnicianEvaluation', ['technicianId', 'year', 'semester'], {
      unique: true,
      name: 'technician_evaluation_period_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TechnicianEvaluation');
  }
}; 