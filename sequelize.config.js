/**
 * UYTECH Sales Dashboard - Sequelize Configuration
 * Configuration for Sequelize ORM connecting to PostgreSQL
 */
require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/uytech_sales_dashboard_dev',
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: false,
    },
    dialectOptions: {
      // Necessary for JSONB fields and PostgreSQL extensions
      useNativeJsonb: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    url: process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/uytech_sales_dashboard_test',
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
}; 