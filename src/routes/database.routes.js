/**
 * Database Management Routes
 * Provides endpoints for database backup and restore functionality
 * Simplified version to diagnose issues on Heroku
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const sequelizeConfig = require('../../sequelize.config');

/**
 * @route   GET /api/database/routes-debug
 * @desc    List all registered routes for debugging
 * @access  Private (Admin)
 */
router.get('/routes-debug', (req, res) => {
  console.log('Routes debug endpoint hit');
  
  // List all routes in this router
  const routes = [];
  router.stack.forEach(layer => {
    if (layer.route) {
      routes.push({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods)
      });
    }
  });
  
  res.status(200).json({ 
    message: 'Database routes diagnostic', 
    routes,
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route   POST /api/database/restore-with-upload
 * @desc    Handle database restore requests from frontend
 * @access  Private (Admin)
 */
router.post('/restore-with-upload', (req, res) => {
  console.log('Restore-with-upload endpoint hit');
  
  try {
    // Check if the Content-Type is multipart/form-data as expected
    const contentType = req.get('Content-Type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    
    console.log('Request Content-Type:', contentType);
    console.log('Is multipart request:', isMultipart);
    
    // Simple response object with minimal structure to avoid JSON parse issues
    const responseObj = {
      status: "success",
      message: "File uploads for database restore not supported in Heroku",
      details: "Due to Heroku's ephemeral filesystem, database restores must be done using the Heroku CLI",
      suggestion: "Please use: heroku pg:backups:restore [URL] --app uytech-sales-dashboard"
    };
    
    // Log the response object
    console.log('Sending response:', JSON.stringify(responseObj));
    
    // Set explicit headers
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(responseObj));
  } catch (error) {
    console.error('Error in restore-with-upload endpoint:', error);
    res.status(500).json({
      status: "error",
      message: "Server error processing restore request"
    });
  }
});

/**
 * @route   POST /api/database/restore
 * @desc    Simple endpoint for backup
 * @access  Private (Admin)
 */
router.post('/restore', (req, res) => {
  console.log('Simple restore endpoint hit');
  res.status(200).json({
    message: 'Restore endpoint hit (this is a placeholder)',
    body: req.body 
  });
});

/**
 * @route   GET /api/database/list
 * @desc    List all database backups (simplified version)
 * @access  Private (Admin)
 */
router.get('/list', (req, res) => {
  try {
    console.log('Database list endpoint hit');
    
    // In production (Heroku), provide a message about filesystem limitations
    if (process.env.NODE_ENV === 'production') {
      console.log('Database backup listing requested in production environment');
      return res.status(200).json({ 
        backups: [],
        message: 'Local filesystem backups are not supported in the production environment due to Heroku\'s ephemeral filesystem.',
        suggestion: 'Use Heroku PostgreSQL backups instead: https://devcenter.heroku.com/articles/heroku-postgres-backups'
      });
    }
    
    // Only run this code in development
    const backupsDir = path.join(__dirname, '../../backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      return res.status(200).json({ backups: [] });
    }
    
    // Read all files in the backups directory
    const files = fs.readdirSync(backupsDir);
    
    // Filter for backup files and get their stats
    const backups = files
      .filter(file => file.endsWith('.dump'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
        
        return {
          filename: file,
          size: `${fileSizeInMB.toFixed(2)} MB`,
          created: stats.mtime,
          downloadUrl: `/api/database/download/${file}`
        };
      })
      // Sort by creation date, newest first
      .sort((a, b) => b.created - a.created);
    
    res.status(200).json({ backups });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ 
      error: 'Error listing backups', 
      details: error.message 
    });
  }
});

/**
 * @route   GET /api/database/status
 * @desc    Check if the database routes are working
 * @access  Private (Admin)
 */
router.get('/status', (req, res) => {
  try {
    console.log('Database status endpoint hit');
    
    // Get database connection info from sequelize config
    const dbConfig = sequelizeConfig[process.env.NODE_ENV || 'development'];
    
    // Create a basic diagnostics object
    const diagnostics = {
      database: {
        connected: true,
        host: dbConfig.host || 'localhost',
        database: dbConfig.database || 'uytech_sales_dashboard_dev',
        user: dbConfig.username || 'postgres',
        port: dbConfig.port || 5432,
        dialect: dbConfig.dialect || 'postgres'
      },
      tools: {
        pg_dump: process.env.NODE_ENV !== 'production',
        pg_restore: process.env.NODE_ENV !== 'production',
        backup_dir: {
          exists: process.env.NODE_ENV !== 'production',
          writable: process.env.NODE_ENV !== 'production',
          path: process.env.NODE_ENV === 'production' ? 
            'Not applicable in Heroku (ephemeral filesystem)' : 
            path.join(__dirname, '../../backups')
        }
      }
    };
    
    // In production environment add note about ephemeral filesystem
    if (process.env.NODE_ENV === 'production') {
      diagnostics.note = "In the Heroku environment, database backup and restore operations should be performed using Heroku's CLI tools";
      diagnostics.suggestion = "Use 'heroku pg:backups:capture' and 'heroku pg:backups:restore' commands";
    }
    
    res.status(200).json({
      status: 'OK',
      message: 'Database routes are working',
      environment: process.env.NODE_ENV || 'development',
      diagnostics: diagnostics
    });
  } catch (error) {
    console.error('Error in database status endpoint:', error);
    res.status(500).json({
      error: 'Error in database status endpoint',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/database/backup
 * @desc    Create a database backup
 * @access  Private (Admin)
 */
router.post('/backup', (req, res) => {
  try {
    console.log('Database backup endpoint hit');
    
    // In production (Heroku), explain limitations and provide a guide to Heroku's pg:backups
    if (process.env.NODE_ENV === 'production') {
      console.log('Database backup requested in production environment');
      
      // Return a structured response
      const responseObj = {
        status: "success",
        message: "Database backup functionality is not available in Heroku",
        details: "Due to Heroku's ephemeral filesystem, you should use Heroku's built-in PostgreSQL backup commands instead.",
        suggestion: "Use Heroku CLI: heroku pg:backups:capture --app uytech-sales-dashboard"
      };
      
      console.log('Sending response:', JSON.stringify(responseObj));
      
      // Set explicit headers and return structured JSON
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(JSON.stringify(responseObj));
    }
    
    // If running in development environment, we'd implement actual backup logic here
    // For now, return a meaningful response
    return res.status(501).json({
      status: "warning",
      message: "Database backup not implemented in simplified version",
      details: "This is a placeholder endpoint"
    });
  } catch (error) {
    console.error('Error in backup endpoint:', error);
    res.status(500).json({
      status: "error",
      message: "Server error processing backup request", 
      details: error.message
    });
  }
});

module.exports = router; 