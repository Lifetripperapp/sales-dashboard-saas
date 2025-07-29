const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const router = express.Router();
const { Service, ClientService, sequelize } = require('../models');

/**
 * Validation schema for creating/updating a service
 */
const serviceSchema = Joi.object({
  nombre: Joi.string().required().trim().max(100),
  descripcion: Joi.string().allow('').max(500).optional(),
  categoria: Joi.string().max(50),
  precio: Joi.number().min(0),
  estado: Joi.string().valid('active', 'inactive').default('active')
});

/**
 * @route   POST /api/servicios
 * @desc    Create a new service
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    console.log('API: Creating service with data:', req.body);
    
    // Validate request body
    const { error, value } = serviceSchema.validate(req.body);
    if (error) {
      console.log('API: Validation error:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Check if a service with the same name already exists
    const existingService = await Service.findOne({
      where: {
        nombre: value.nombre
      }
    });
    
    if (existingService) {
      return res.status(409).json({
        success: false,
        error: 'A service with this name already exists'
      });
    }
    
    // Create new service
    const newService = await Service.create(value);
    
    console.log('API: Created service successfully:', newService.id);
    return res.status(201).json({
      success: true,
      data: newService
    });
  } catch (error) {
    console.error('Error creating service:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error creating service'
    });
  }
});

/**
 * @route   GET /api/servicios
 * @desc    Get all services with optional filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    console.log('API: Fetching services with query params:', req.query);
    
    const {
      nombre,
      categoria,
      estado = 'active',
      page = 1,
      limit = 10,
      sortBy = 'nombre',
      sortDir = 'ASC'
    } = req.query;
    
    // Prepare filter conditions
    const whereClause = {};
    
    if (nombre) {
      console.log(`API: Filtering by nombre: "${nombre}"`);
      whereClause.nombre = { [Op.iLike]: `%${nombre}%` };
    }
    
    if (categoria && categoria.trim() !== '') {
      console.log(`API: Filtering by categoria: "${categoria}"`);
      // Use exact match
      whereClause.categoria = categoria.trim();
    }
    
    // Debug the final where clause
    console.log('API: Using filter conditions:', JSON.stringify(whereClause));
    
    // Estado filter removed due to missing column
    // if (estado) {
    //   whereClause.estado = estado;
    // }
    
    // Calculate offset for pagination
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    try {
    // Validate sort parameters
    const validSortColumns = ['nombre', 'categoria', 'precio'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'nombre';
    const sortDirection = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // Fetch services with pagination
      const services = await Service.findAll({
      where: whereClause,
      order: [[sortColumn, sortDirection]],
      limit: parseInt(limit, 10),
      offset
    });
    
      // Get service categories for filtering (if needed)
    const categories = await Service.findAll({
      attributes: ['categoria'],
      group: ['categoria'],
      where: {
        categoria: {
          [Op.ne]: null,
          [Op.ne]: ''
        }
      },
      raw: true
    });
    
    const uniqueCategories = categories.map(c => c.categoria);
    
      // Count total services
      const count = await Service.count({ where: whereClause });
      
      // Add client count for each service
      const serviceIds = services.map(service => service.id);
      
      // Get counts of clients per service
      const clientCounts = await ClientService.findAll({
        attributes: [
          'servicioId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          servicioId: {
            [Op.in]: serviceIds
          }
        },
        group: ['servicioId'],
        raw: true
      });
      
      // Create a map of service ID to client count
      const countMap = {};
      clientCounts.forEach(count => {
        countMap[count.servicioId] = parseInt(count.count, 10);
      });
      
      // Add client count to each service
      const servicesWithCount = services.map(service => {
        const servicePlain = service.get({ plain: true });
        servicePlain.clientCount = countMap[service.id] || 0;
        return servicePlain;
      });
      
      console.log(`API: Fetched services: ${count}`);
    return res.json({
      success: true,
      data: {
          rows: servicesWithCount,
          count,
          totalPages: Math.ceil(count / parseInt(limit, 10)),
        currentPage: parseInt(page, 10),
        categories: uniqueCategories
      }
    });
    } catch (innerError) {
      console.error('Error in service query:', innerError.message, innerError.stack);
      
      // Fallback to an empty response
      return res.json({
        success: true,
        data: {
          rows: [],
          count: 0,
          totalPages: 0,
          currentPage: 1,
          categories: []
        }
      });
    }
  } catch (error) {
    console.error('Error fetching services:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching services'
    });
  }
});

/**
 * @route   GET /api/servicios/:id
 * @desc    Get a service by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    console.log(`API: Fetching service with ID: ${req.params.id}`);
    
    const service = await Service.findByPk(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    // Get count of clients using this service
    const clientCount = await ClientService.count({
      where: {
        servicioId: req.params.id
      }
    });
    
    const serviceData = service.get({ plain: true });
    serviceData.clientCount = clientCount;
    
    console.log(`API: Fetched service: ${service.id}`);
    return res.json({
      success: true,
      data: serviceData
    });
  } catch (error) {
    console.error('Error fetching service:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching service'
    });
  }
});

/**
 * @route   PUT /api/servicios/:id
 * @desc    Update a service
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    console.log(`API: Updating service with ID: ${req.params.id}`);
    
    // Validate request body
    const { error, value } = serviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Find service
    const service = await Service.findByPk(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    // Check if name is already used by another service
    if (value.nombre !== service.nombre) {
      const existingService = await Service.findOne({
        where: {
          nombre: value.nombre,
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existingService) {
        return res.status(409).json({
          success: false,
          error: 'Another service with this name already exists'
        });
      }
    }
    
    // Update service
    await service.update(value);
    
    console.log(`API: Updated service: ${service.id}`);
    return res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error updating service:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error updating service'
    });
  }
});

/**
 * @route   DELETE /api/servicios/:id
 * @desc    Delete a service
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log(`API: Deleting service with ID: ${req.params.id}`);
    
    // Find service
    const service = await Service.findByPk(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    // Delete the service (CASCADE will handle related ClientService records)
    await service.destroy();
    
    console.log(`API: Deleted service: ${req.params.id}`);
    return res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error deleting service'
    });
  }
});

module.exports = router; 