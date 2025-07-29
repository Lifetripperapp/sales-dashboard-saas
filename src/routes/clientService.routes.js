const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { ClientService, Client, Service, sequelize } = require('../models');

/**
 * Validation schema for creating/updating a client-service association
 */
const clientServiceSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  servicioId: Joi.string().uuid().required(),
  fechaAsignacion: Joi.date().default(() => new Date()),
  notas: Joi.string().allow('').max(500)
});

/**
 * @route   POST /api/cliente-servicios
 * @desc    Create a new client-service association
 * @access  Private
 */
router.post('/', async (req, res) => {
  let transaction;
  
  try {
    console.log('[DEBUG-SERVER] Creating client-service association with data:', JSON.stringify(req.body));
    
    // Validate request body
    const { error, value } = clientServiceSchema.validate(req.body);
    if (error) {
      console.log('[DEBUG-SERVER] Validation error:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Log the validated data
    console.log('[DEBUG-SERVER] Validated data:', JSON.stringify(value));
    
    // Check if client exists
    const client = await Client.findByPk(value.clientId);
    if (!client) {
      console.log('[DEBUG-SERVER] Client not found with ID:', value.clientId);
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    console.log('[DEBUG-SERVER] Found client:', client.nombre);
    
    // Check if service exists
    const service = await Service.findByPk(value.servicioId);
    if (!service) {
      console.log('[DEBUG-SERVER] Service not found with ID:', value.servicioId);
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    console.log('[DEBUG-SERVER] Found service:', service.nombre);
    
    // Start transaction
    transaction = await sequelize.transaction();
    
    // Check if the association already exists
    const existingAssociation = await ClientService.findOne({
      where: {
        clientId: value.clientId,
        servicioId: value.servicioId
      },
      transaction
    });
    
    // If the association already exists, return success (idempotent operation)
    if (existingAssociation) {
      console.log('[DEBUG-SERVER] Client-service association already exists:', existingAssociation.id);
      await transaction.commit();
      return res.status(200).json({
        success: true,
        data: existingAssociation,
        message: 'Service is already assigned to this client'
      });
    }
    
    try {
      // Format the data for creation
      const creationData = {
        clientId: value.clientId,
        servicioId: value.servicioId,
        fechaAsignacion: value.fechaAsignacion ? new Date(value.fechaAsignacion) : new Date(),
        notas: value.notas || ''
      };
      
      console.log('[DEBUG-SERVER] Creating association with data:', JSON.stringify(creationData));
      
      // Create new association within transaction
      const newAssociation = await ClientService.create(creationData, { transaction });
      
      // Commit the transaction
      await transaction.commit();
      transaction = null;
    
      console.log('[DEBUG-SERVER] Created client-service association successfully:', newAssociation.id);
      return res.status(201).json({
        success: true,
        data: newAssociation
      });
    } catch (error) {
      // Rollback transaction on error
      if (transaction) await transaction.rollback();
      
      console.error('[DEBUG-SERVER] Error creating association:', error.message, error.stack);
      console.error('[DEBUG-SERVER] Error name:', error.name);
      
      // Check for unique constraint violation
      if (error.name === 'SequelizeUniqueConstraintError') {
        // If it's a unique constraint error, the service is already assigned
        return res.status(409).json({
          success: false,
          error: 'Service is already assigned to this client (unique constraint error)'
        });
      }
      
      // Check for validation errors
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error: ' + error.message
        });
      }
      
      // Generic database error
      return res.status(500).json({
        success: false,
        error: 'Database error creating client-service association'
      });
    }
  } catch (error) {
    // Rollback transaction on error
    if (transaction) await transaction.rollback();
    
    console.error('[DEBUG-SERVER] Error creating client-service association:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error creating client-service association'
    });
  }
});

/**
 * @route   GET /api/cliente-servicios/cliente/:clientId
 * @desc    Get all services for a specific client
 * @access  Private
 */
router.get('/cliente/:clientId', async (req, res) => {
  try {
    console.log(`API: Fetching services for client: ${req.params.clientId}`);
    
    // Check if client exists
    const client = await Client.findByPk(req.params.clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    try {
      // Fetch client services with the standardized field name
      const clientServices = await ClientService.findAll({
        where: {
          clientId: req.params.clientId
        },
        include: [
          {
            model: Service,
            as: 'servicio'
          }
        ]
      });
    
      console.log(`API: Fetched ${clientServices.length} services for client: ${req.params.clientId}`);
      return res.json({
        success: true,
        data: clientServices
      });
    } catch (error) {
      console.error('Error in clientService query:', error.message);
      // Return empty data on error
      return res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Error fetching client services:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching client services'
    });
  }
});

/**
 * @route   GET /api/cliente-servicios/service/:servicioId
 * @desc    Get all clients for a specific service
 * @access  Private
 */
router.get('/service/:servicioId', async (req, res) => {
  try {
    console.log(`API: Fetching clients for service: ${req.params.servicioId}`);
    
    // Check if service exists
    const service = await Service.findByPk(req.params.servicioId);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    try {
      // Fetch service clients with the correct field name
    const serviceClients = await ClientService.findAll({
      where: {
        servicioId: req.params.servicioId
      },
      include: [
        {
          model: Client,
          as: 'cliente'
        }
      ]
    });
    
    console.log(`API: Fetched ${serviceClients.length} clients for service: ${req.params.servicioId}`);
    return res.json({
      success: true,
      data: serviceClients
    });
    } catch (error) {
      console.error('Error in serviceClient query:', error.message);
      // Return empty data on error
      return res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Error fetching service clients:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching service clients'
    });
  }
});

/**
 * @route   PUT /api/cliente-servicios/:id
 * @desc    Update a client-service association
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  let transaction;
  
  try {
    console.log(`API: Updating client-service association with ID: ${req.params.id}`);
    
    // We only allow updating notes for a client-service association
    const { notas } = req.body;
    
    if (notas === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Notes field is required'
      });
    }
    
    // Start transaction
    transaction = await sequelize.transaction();
    
    // Find association
    const association = await ClientService.findByPk(req.params.id, { transaction });
    
    if (!association) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Client-service association not found'
      });
    }
    
    // Update association
    await association.update({ notas }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    transaction = null;
    
    console.log(`API: Updated client-service association: ${association.id}`);
    return res.json({
      success: true,
      data: association
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error updating client-service association:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error updating client-service association'
    });
  }
});

/**
 * @route   DELETE /api/cliente-servicios/:id
 * @desc    Delete a client-service association
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  let transaction;
  
  try {
    console.log(`API: Deleting client-service association with ID: ${req.params.id}`);
    
    // Start transaction
    transaction = await sequelize.transaction();
    
    // Find association
    const association = await ClientService.findByPk(req.params.id, { transaction });
    
    if (!association) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Client-service association not found'
      });
    }
    
    // Delete the association
    await association.destroy({ transaction });
    
    // Commit transaction
    await transaction.commit();
    transaction = null;
    
    console.log(`API: Deleted client-service association: ${req.params.id}`);
    return res.json({
      success: true,
      message: 'Client-service association deleted successfully'
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error deleting client-service association:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error deleting client-service association'
    });
  }
});

/**
 * @route   DELETE /api/cliente-servicios/cliente/:clientId/service/:servicioId
 * @desc    Delete a client-service association by client and service IDs
 * @access  Private
 */
router.delete('/cliente/:clientId/service/:servicioId', async (req, res) => {
  let transaction;
  
  try {
    console.log(`[DEBUG-SERVER] Deleting client-service association for client ${req.params.clientId} and service ${req.params.servicioId}`);
    
    // Start transaction
    transaction = await sequelize.transaction();
    
    // Find association
    const association = await ClientService.findOne({
      where: {
        clientId: req.params.clientId,
        servicioId: req.params.servicioId
      },
      transaction
    });
    
    if (!association) {
      await transaction.rollback();
      console.log('[DEBUG-SERVER] Client-service association not found for delete operation');
      return res.status(404).json({
        success: false,
        error: 'Client-service association not found'
      });
    }
    
    console.log('[DEBUG-SERVER] Found association to delete:', association.id);
    
    // Delete the association
    await association.destroy({ transaction });
    
    // Commit transaction
    await transaction.commit();
    transaction = null;
    
    console.log(`[DEBUG-SERVER] Successfully deleted client-service association for client ${req.params.clientId} and service ${req.params.servicioId}`);
    return res.json({
      success: true,
      message: 'Client-service association deleted successfully'
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('[DEBUG-SERVER] Error deleting client-service association:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error deleting client-service association'
    });
  }
});

/**
 * @route   GET /api/cliente-servicios/cliente/:clientId/count
 * @desc    Get count of services for a specific client
 * @access  Private
 */
router.get('/cliente/:clientId/count', async (req, res) => {
  try {
    console.log(`API: Fetching service count for client: ${req.params.clientId}`);
    
    // Check if client exists
    const client = await Client.findByPk(req.params.clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    try {
      // Count client services with the standardized field name
      const count = await ClientService.count({
        where: {
          clientId: req.params.clientId
        }
      });
      
      console.log(`API: Found ${count} services for client: ${req.params.clientId}`);
      return res.json({
        success: true,
        count: count
      });
    } catch (error) {
      console.error('Error in clientService count query:', error.message);
      // Return zero on error
      return res.json({
        success: true,
        count: 0
      });
    }
  } catch (error) {
    console.error('Error fetching client service count:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching client service count'
    });
  }
});

/**
 * @route   POST /api/cliente-servicios/health-check
 * @desc    Check and fix any inconsistencies in client-service associations
 * @access  Private
 */
router.post('/health-check', async (req, res) => {
  let transaction;
  let report = {
    issues: [],
    fixed: [],
    success: true
  };
  
  try {
    console.log('[DEBUG-SERVER] Running client-service health check');
    
    // Check for client-service entries without required fields
    const incompleteEntries = await ClientService.findAll({
      where: sequelize.literal('("fechaAsignacion" IS NULL OR "notas" IS NULL)'),
      raw: true
    });
    
    if (incompleteEntries.length > 0) {
      console.log(`[DEBUG-SERVER] Found ${incompleteEntries.length} incomplete client-service entries`);
      report.issues.push(`Found ${incompleteEntries.length} incomplete client-service entries`);
      
      // Fix incomplete entries
      transaction = await sequelize.transaction();
      
      for (const entry of incompleteEntries) {
        try {
          await ClientService.update(
            {
              fechaAsignacion: entry.fechaAsignacion || new Date(),
              notas: entry.notas || ''
            },
            {
              where: { id: entry.id },
              transaction
            }
          );
          report.fixed.push(`Fixed incomplete entry: ${entry.id}`);
        } catch (updateError) {
          console.error(`[DEBUG-SERVER] Error fixing entry ${entry.id}:`, updateError.message);
          report.issues.push(`Failed to fix entry ${entry.id}: ${updateError.message}`);
          report.success = false;
        }
      }
      
      await transaction.commit();
      transaction = null;
    } else {
      console.log('[DEBUG-SERVER] No incomplete client-service entries found');
    }
    
    // Check for invalid client references
    const invalidClientReferences = await ClientService.findAll({
      include: [
        {
          model: Client,
          as: 'cliente',
          required: false
        }
      ],
      where: sequelize.literal('"cliente"."id" IS NULL'),
      raw: true
    });
    
    if (invalidClientReferences.length > 0) {
      console.log(`[DEBUG-SERVER] Found ${invalidClientReferences.length} client-service entries with invalid client references`);
      report.issues.push(`Found ${invalidClientReferences.length} entries with invalid client references`);
      
      // These should be deleted as they reference non-existent clients
      transaction = await sequelize.transaction();
      
      for (const entry of invalidClientReferences) {
        try {
          await ClientService.destroy({
            where: { id: entry.id },
            transaction
          });
          report.fixed.push(`Removed invalid client reference: ${entry.id}`);
        } catch (deleteError) {
          console.error(`[DEBUG-SERVER] Error removing invalid entry ${entry.id}:`, deleteError.message);
          report.issues.push(`Failed to remove invalid entry ${entry.id}: ${deleteError.message}`);
          report.success = false;
        }
      }
      
      await transaction.commit();
      transaction = null;
    } else {
      console.log('[DEBUG-SERVER] No invalid client references found');
    }
    
    // Check for invalid service references
    const invalidServiceReferences = await ClientService.findAll({
      include: [
        {
          model: Service,
          as: 'servicio',
          required: false
        }
      ],
      where: sequelize.literal('"servicio"."id" IS NULL'),
      raw: true
    });
    
    if (invalidServiceReferences.length > 0) {
      console.log(`[DEBUG-SERVER] Found ${invalidServiceReferences.length} client-service entries with invalid service references`);
      report.issues.push(`Found ${invalidServiceReferences.length} entries with invalid service references`);
      
      // These should be deleted as they reference non-existent services
      transaction = await sequelize.transaction();
      
      for (const entry of invalidServiceReferences) {
        try {
          await ClientService.destroy({
            where: { id: entry.id },
            transaction
          });
          report.fixed.push(`Removed invalid service reference: ${entry.id}`);
        } catch (deleteError) {
          console.error(`[DEBUG-SERVER] Error removing invalid entry ${entry.id}:`, deleteError.message);
          report.issues.push(`Failed to remove invalid entry ${entry.id}: ${deleteError.message}`);
          report.success = false;
        }
      }
      
      await transaction.commit();
      transaction = null;
    } else {
      console.log('[DEBUG-SERVER] No invalid service references found');
    }
    
    // Check for duplicate client-service pairings
    const duplicatePairings = await ClientService.findAll({
      attributes: ['clientId', 'servicioId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['clientId', 'servicioId'],
      having: sequelize.literal('COUNT(id) > 1'),
      raw: true
    });
    
    if (duplicatePairings.length > 0) {
      console.log(`[DEBUG-SERVER] Found ${duplicatePairings.length} duplicate client-service pairings`);
      report.issues.push(`Found ${duplicatePairings.length} duplicate client-service pairings`);
      
      // Fix duplicate pairings by keeping only the newest entry
      transaction = await sequelize.transaction();
      
      for (const dup of duplicatePairings) {
        try {
          // Find all entries with this client-service pairing
          const entries = await ClientService.findAll({
            where: {
              clientId: dup.clientId,
              servicioId: dup.servicioId
            },
            order: [['createdAt', 'DESC']],
            transaction
          });
          
          // Keep the first one (newest) and delete the rest
          for (let i = 1; i < entries.length; i++) {
            await entries[i].destroy({ transaction });
            report.fixed.push(`Removed duplicate entry: ${entries[i].id}`);
          }
        } catch (fixError) {
          console.error(`[DEBUG-SERVER] Error fixing duplicate pairing:`, fixError.message);
          report.issues.push(`Failed to fix duplicate pairing: ${fixError.message}`);
          report.success = false;
        }
      }
      
      await transaction.commit();
      transaction = null;
    } else {
      console.log('[DEBUG-SERVER] No duplicate client-service pairings found');
    }
    
    // Return health check report
    return res.json({
      success: report.success,
      report
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('[DEBUG-SERVER] Error during client-service health check:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error during client-service health check',
      details: error.message
    });
  }
});

module.exports = router; 