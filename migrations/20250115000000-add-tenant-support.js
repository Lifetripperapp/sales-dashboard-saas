'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add tenantId to all main tables
    const tables = [
      'Client',
      'Salesperson', 
      'Service',
      'ClientService',
      'QualitativeObjective',
      'QuantitativeObjective',
      'SalespersonObjective',
      'SalespersonQuantitativeObjective',
      'Technician',
      'TechnicianEvaluation',
      'TechnicianObjective',
      'QuantitativeObjectiveTemplate'
    ];

    for (const table of tables) {
      await queryInterface.addColumn(table, 'tenantId', {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'), // Temporary default for existing data
        after: 'id'
      });

      // Create index for better performance
      await queryInterface.addIndex(table, ['tenantId'], {
        name: `${table.toLowerCase()}_tenant_id_idx`
      });
    }

    // Create Tenants table
    await queryInterface.createTable('Tenant', {
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
      domain: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      plan: {
        type: Sequelize.ENUM('free', 'basic', 'premium'),
        allowNull: false,
        defaultValue: 'free'
      },
      maxUsers: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5
      },
      maxClients: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50
      },
      features: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Enabled features for this tenant'
      },
      settings: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Tenant-specific settings'
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create TenantUsers table for user-tenant relationships
    await queryInterface.createTable('TenantUser', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Tenant',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      auth0UserId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'manager', 'user'),
        allowNull: false,
        defaultValue: 'user'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique constraint for tenant-user combination
    await queryInterface.addIndex('TenantUser', ['tenantId', 'auth0UserId'], {
      unique: true,
      name: 'tenant_user_unique_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove tenantId from all tables
    const tables = [
      'Client',
      'Salesperson', 
      'Service',
      'ClientService',
      'QualitativeObjective',
      'QuantitativeObjective',
      'SalespersonObjective',
      'SalespersonQuantitativeObjective',
      'Technician',
      'TechnicianEvaluation',
      'TechnicianObjective',
      'QuantitativeObjectiveTemplate'
    ];

    for (const table of tables) {
      await queryInterface.removeIndex(table, `${table.toLowerCase()}_tenant_id_idx`);
      await queryInterface.removeColumn(table, 'tenantId');
    }

    // Drop TenantUser table
    await queryInterface.dropTable('TenantUser');
    
    // Drop Tenant table
    await queryInterface.dropTable('Tenant');
  }
}; 