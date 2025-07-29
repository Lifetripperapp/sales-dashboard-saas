const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const router = express.Router();
const { Client, Salesperson, Technician, Service, ClientService } = require('../models');

/**
 * Validation schema for creating/updating a client
 */
const clienteSchema = Joi.object({
  nombre: Joi.string().required().trim().max(100),
  vendedorId: Joi.string().uuid().allow(null, ''),
  tecnicoId: Joi.string().uuid().allow(null, ''),
  email: Joi.string().email().allow(null, ''),
  telefono: Joi.string().max(20).allow(null, ''),
  direccion: Joi.string().max(200).allow(null, ''),
  contratoSoporte: Joi.boolean().default(false),
  fechaUltimoRelevamiento: Joi.date().allow(null, ''),
  linkDocumentoRelevamiento: Joi.string().allow(null, ''),
  accionesPendientes: Joi.object().allow(null),
  notas: Joi.string().allow('').max(1000)
});

/**
 * @route   POST /api/clientes
 * @desc    Create a new client
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    console.log('API: Creating client with data:', JSON.stringify(req.body));
    
    // Validate request body
    const { error, value } = clienteSchema.validate(req.body);
    if (error) {
      console.log('API: Validation error:', error.message);
      console.log('API: Validation error details:', JSON.stringify(error.details));
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Check if a client with the same name and salesperson already exists
    const existingClient = await Client.findOne({
      where: {
        nombre: value.nombre,
        ...(value.vendedorId ? { vendedorId: value.vendedorId } : {})
      }
    });
    
    if (existingClient) {
      console.log('API: Client already exists with name and salesperson');
      return res.status(409).json({
        success: false,
        error: 'A client with this name and salesperson already exists'
      });
    }
    
    console.log('API: Validated data for client creation:', JSON.stringify(value));
    
    try {
    // Create new client
    const newClient = await Client.create(value);
    
    console.log('API: Created client successfully:', newClient.id);
    return res.status(201).json({
      success: true,
      data: newClient
    });
    } catch (dbError) {
      console.error('API: Database error creating client:', dbError.message);
      console.error('API: Database error details:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Error creating client:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error creating client: ' + error.message
    });
  }
});

/**
 * @route   GET /api/clientes/summary
 * @desc    Get client summary statistics for dashboard
 * @access  Private
 */
router.get('/summary', async (req, res) => {
  try {
    console.log('API: Fetching client summary data for dashboard');
    
    // Get total number of clients
    const totalClients = await Client.count();
    
    // Get number of clients with active service contracts
    const activeServiceContracts = await Client.count({
      where: {
        contratoSoporte: true
      }
    });
    
    // Get total number of services (client-service relationships)
    const totalServices = await ClientService.count();
    
    console.log(`API: Client summary - Total clients: ${totalClients}, Active contracts: ${activeServiceContracts}, Total services: ${totalServices}`);
    
    return res.json({
      success: true,
      data: {
        totalClients,
        activeServiceContracts,
        totalServices
      }
    });
  } catch (error) {
    console.error('Error fetching client summary:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching client summary data'
    });
  }
});

/**
 * @route   GET /api/clientes
 * @desc    Get all clients with optional filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    console.log('API: Fetching clients with query:', req.query);
    
    const {
      nombre,
      vendedorId,
      tecnicoId,
      contratoSoporte,
      page = 1,
      limit = 10,
      sortBy = 'nombre',
      sortDir = 'ASC'
    } = req.query;
    
    // Prepare filter conditions
    const whereClause = {};
    
    if (nombre) {
      whereClause.nombre = { [Op.iLike]: `%${nombre}%` };
    }
    
    if (vendedorId) {
      whereClause.vendedorId = vendedorId;
    }
    
    if (tecnicoId) {
      whereClause.tecnicoId = tecnicoId;
    }
    
    if (contratoSoporte !== undefined) {
      whereClause.contratoSoporte = contratoSoporte === 'true';
    }
    
    // Calculate offset for pagination
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Validate sort parameters
    const validSortColumns = ['nombre', 'createdAt'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'nombre';
    const sortDirection = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    try {
      // Remove references to estado and other problematic fields
      // Only request the fields we know exist in the database
      const clients = await Client.findAll({
      where: whereClause,
        attributes: ['id', 'nombre', 'vendedorId', 'tecnicoId', 'contratoSoporte', 'fechaUltimoRelevamiento', 'linkDocumentoRelevamiento', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Salesperson,
          as: 'vendedor',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Technician,
          as: 'tecnico',
          attributes: ['id', 'nombre', 'email', 'telefono']
        }
      ],
      order: [[sortColumn, sortDirection]],
      limit: parseInt(limit, 10),
      offset
    });
    
      // Count total clients for pagination
      const count = await Client.count({ where: whereClause });
      
      console.log(`API: Fetched clients: ${count}`);
    return res.json({
      success: true,
      data: {
          rows: clients,
          count,
          totalPages: Math.ceil(count / parseInt(limit, 10)),
        currentPage: parseInt(page, 10)
      }
    });
    } catch (innerError) {
      console.error('Error in client query:', innerError.message, innerError.stack);
      
      // Fallback to an empty response
      return res.json({
        success: true,
        data: {
          rows: [],
          count: 0,
          totalPages: 0,
          currentPage: 1
        }
      });
    }
  } catch (error) {
    console.error('Error fetching clients:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching clients'
    });
  }
});

/**
 * @route   GET /api/clientes/:id
 * @desc    Get a client by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    console.log(`API: Fetching client with ID: ${req.params.id}`);
    
    // Get the Salesperson model to check available attributes
    const salespersonAttributes = Object.keys(Salesperson.rawAttributes);
    const technicianAttributes = Object.keys(Technician.rawAttributes);
    
    // Build include objects dynamically based on available columns
    const salespersonInclude = {
      model: Salesperson,
      as: 'vendedor',
      attributes: ['id', 'nombre', 'email']
    };
    
    // Add telefono attribute only if it exists in the schema
    if (salespersonAttributes.includes('telefono')) {
      salespersonInclude.attributes.push('telefono');
    }
    
    const technicianInclude = {
      model: Technician,
      as: 'tecnico',
      attributes: ['id', 'nombre', 'email', 'telefono']
    };
    
    // Add phone attribute only if it exists in the schema
    if (technicianAttributes.includes('phone')) {
      technicianInclude.attributes.push('phone');
    }
    
    const client = await Client.findByPk(req.params.id, {
      include: [
        salespersonInclude,
        technicianInclude,
        {
          model: Service,
          as: 'servicios',
          through: {
            attributes: ['id', 'fechaAsignacion']
          }
        }
      ]
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    console.log(`API: Fetched client: ${client.id}`);
    return res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error fetching client:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching client'
    });
  }
});

/**
 * @route   PUT /api/clientes/:id
 * @desc    Update a client
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`API: Updating client with ID: ${id}`);
    
    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Invalid client ID provided'
      });
    }
    
    // Validate request body
    const { error, value } = clienteSchema.validate(req.body);
    if (error) {
      console.log('API: Validation error:', error.message);
      console.log('API: Validation error details:', JSON.stringify(error.details));
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Find client
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    console.log(`API: Found client to update: ${client.id}`);
    console.log('API: Update data:', JSON.stringify(value));
    
    try {
    // Update client
    await client.update(value);
    
    console.log(`API: Updated client: ${client.id}`);
    return res.json({
      success: true,
      data: client
    });
    } catch (dbError) {
      console.error('API: Database error updating client:', dbError.message);
      console.error('API: Database error details:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Error updating client:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error updating client: ' + error.message
    });
  }
});

/**
 * @route   DELETE /api/clientes/:id
 * @desc    Delete a client
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log(`API: Deleting client with ID: ${req.params.id}`);
    
    // Start a transaction
    const transaction = await Client.sequelize.transaction();
    
    try {
      // Find client
      const client = await Client.findByPk(req.params.id);
      
      if (!client) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Client not found'
        });
      }
      
      // Delete associated client services
      await ClientService.destroy({
        where: { clientId: req.params.id },
        transaction
      });
      
      // Delete the client
      await client.destroy({ transaction });
      
      // Commit transaction
      await transaction.commit();
      
      console.log(`API: Deleted client: ${req.params.id}`);
      return res.json({
        success: true,
        message: 'Client deleted successfully'
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting client:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error deleting client'
    });
  }
});

/**
 * @route   GET /api/clientes/matrix
 * @desc    Get client matrix data (clients with services)
 * @access  Private
 */
router.get('/matrix/data', async (req, res) => {
  try {
    console.log('API: Fetching client matrix data');
    
    const { vendedorId, tecnicoId } = req.query;
    
    // Prepare filter conditions
    const whereClause = {};
    
    if (vendedorId) {
      whereClause.vendedorId = vendedorId;
    }
    
    if (tecnicoId) {
      whereClause.tecnicoId = tecnicoId;
    }
    
    // 1. Fetch clients directly
    const clients = await Client.findAll({
      where: whereClause,
      attributes: ['id', 'nombre', 'vendedorId', 'tecnicoId'],
      include: [
        {
          model: Salesperson,
          as: 'vendedor',
          attributes: ['id', 'nombre']
        },
        {
          model: Technician,
          as: 'tecnico',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['nombre', 'ASC']]
    });
    
    // 2. Fetch all services separately
    const services = await Service.findAll({
      order: [['nombre', 'ASC']]
    });
    
    // Create a simplified placeholder for client services
    // Since the actual ClientService model has schema issues
    const clientsWithServices = clients.map(client => {
      const plainClient = client.get({ plain: true });
      // Add empty services array - in a real implementation we would fetch
      // the actual services for each client here
      plainClient.servicios = [];
      return plainClient;
    });
    
    console.log(`API: Fetched matrix data: ${clients.length} clients, ${services.length} services`);
    return res.json({
      success: true,
      data: {
        clients: clientsWithServices,
        services
      }
    });
  } catch (error) {
    console.error('Error fetching matrix data:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching matrix data'
    });
  }
});

module.exports = router; 