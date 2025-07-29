'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // This migration doesn't need to create the tables as they already exist
    // It's just here to ensure the migrations run in order
    // Check if tables exist and if not, create them

    // Check if QuantitativeObjective table exists
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('QuantitativeObjective')) {
      await queryInterface.createTable('QuantitativeObjective', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        type: {
          type: Sequelize.ENUM('currency', 'percentage', 'number'),
          allowNull: false
        },
        companyTarget: {
          type: Sequelize.FLOAT,
          allowNull: false,
          validate: {
            min: 0
          }
        },
        minimumAcceptable: {
          type: Sequelize.FLOAT,
          allowNull: true
        },
        weight: {
          type: Sequelize.FLOAT,
          allowNull: true
        },
        startDate: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        endDate: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'not_completed'),
          allowNull: false,
          defaultValue: 'pending'
        },
        isGlobal: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        templateId: {
          type: Sequelize.UUID,
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
    }

    // Check if SalespersonQuantitativeObjective table exists
    if (!tables.includes('SalespersonQuantitativeObjective')) {
      await queryInterface.createTable('SalespersonQuantitativeObjective', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        salespersonId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Salesperson',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        quantitativeObjectiveId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'QuantitativeObjective',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        individualTarget: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        monthlyProgress: {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {}
        },
        currentValue: {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 0
        },
        status: {
          type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'not_completed'),
          allowNull: false,
          defaultValue: 'pending'
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
    }

    // Ensure type enum has all required values
    try {
      await queryInterface.sequelize.query(
        `ALTER TYPE enum_QuantitativeObjective_type ADD VALUE IF NOT EXISTS 'currency'`
      );
      await queryInterface.sequelize.query(
        `ALTER TYPE enum_QuantitativeObjective_type ADD VALUE IF NOT EXISTS 'percentage'`
      );
      await queryInterface.sequelize.query(
        `ALTER TYPE enum_QuantitativeObjective_type ADD VALUE IF NOT EXISTS 'number'`
      );
    } catch (error) {
      console.log('Type enum values already exist or could not be added:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // Don't drop tables in down migration as they might be used by other parts of the application
    // Just add a comment to manually handle if needed
    console.log('To revert this migration, you would need to manually modify or drop the tables');
  }
};
