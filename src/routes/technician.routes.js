const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const router = express.Router();
const { Technician, Client, TechnicianObjective, TechnicianEvaluation } = require('../models');

/**
 * Validation schema for creating/updating a technician
 */
const technicianSchema = Joi.object({
  nombre: Joi.string().required().trim().max(100),
  email: Joi.string().email().required(),
  telefono: Joi.string().allow('').max(20).optional(),
  especialidad: Joi.string().allow('').max(100).optional(),
  estado: Joi.string().valid('active', 'inactive').default('active'),
  notas: Joi.string().allow('').optional()
});

/**
 * @route   POST /api/tecnicos
 * @desc    Create a new technician
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    console.log('API: Creating technician with data:', req.body);
    
    // Validate request body
    const { error, value } = technicianSchema.validate(req.body);
    if (error) {
      console.log('API: Validation error:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Check if a technician with the same email already exists
    const existingTechnician = await Technician.findOne({
      where: {
        email: value.email
      }
    });
    
    if (existingTechnician) {
      return res.status(409).json({
        success: false,
        error: 'A technician with this email already exists'
      });
    }
    
    // Create new technician
    const newTechnician = await Technician.create(value);
    
    console.log('API: Created technician successfully:', newTechnician.id);
    return res.status(201).json({
      success: true,
      data: newTechnician
    });
  } catch (error) {
    console.error('Error creating technician:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error creating technician'
    });
  }
});

/**
 * @route   GET /api/tecnicos
 * @desc    Get all technicians with optional filters
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    console.log('API: Fetching technicians with query:', req.query);
    
    const {
      nombre,
      especialidad,
      estado,
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
    
    if (especialidad) {
      whereClause.especialidad = { [Op.iLike]: `%${especialidad}%` };
    }
    
    if (estado && estado !== '') {
      whereClause.estado = estado;
    }
    
    // Calculate offset for pagination
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Validate sort parameters
    const validSortColumns = ['nombre', 'createdAt', 'especialidad'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'nombre';
    const sortDirection = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // Fetch technicians with pagination
    console.log('Debug: Using where clause:', JSON.stringify(whereClause));
    console.log('Debug: Table name from model:', Technician.tableName);
    console.log('Debug: Model name:', Technician.name);
    
    try {
      // Get model attributes to debug
      const attributes = Object.keys(Technician.rawAttributes);
      console.log('Debug: Model attributes:', attributes);
      
      // Try a simpler query first to isolate issues
      console.log('Debug: Attempting simple find query');
      const techCount = await Technician.count();
      console.log('Debug: Technician count:', techCount);
      
      // Now try the full query
      console.log('Debug: Attempting full findAndCountAll query');
      const technicians = await Technician.findAndCountAll({
        where: whereClause,
        order: [[sortColumn, sortDirection]],
        limit: parseInt(limit, 10),
        offset
      });
      
      console.log('Debug: Query succeeded, found', technicians.count, 'technicians');
      
      // Get count of assigned clients for each technician
      const technicianIds = technicians.rows.map(tech => tech.id);
      
      if (technicianIds.length > 0) {
        const clientCounts = await Client.findAll({
          attributes: [
            'tecnicoId',
            [Technician.sequelize.fn('COUNT', Technician.sequelize.col('id')), 'clientCount']
          ],
          where: {
            tecnicoId: {
              [Op.in]: technicianIds
            }
          },
          group: ['tecnicoId'],
          raw: true
        });
        
        // Map client counts to technician objects
        const countMap = {};
        clientCounts.forEach(count => {
          countMap[count.tecnicoId] = parseInt(count.clientCount, 10);
        });
        
        technicians.rows = technicians.rows.map(tech => {
          const plainTech = tech.get({ plain: true });
          plainTech.clientCount = countMap[tech.id] || 0;
          return plainTech;
        });
      }
      
      console.log(`API: Fetched technicians: ${technicians.count}`);
      return res.json({
        success: true,
        data: {
          rows: technicians.rows,
          count: technicians.count,
          totalPages: Math.ceil(technicians.count / parseInt(limit, 10)),
          currentPage: parseInt(page, 10)
        }
      });
    } catch (queryError) {
      console.error('Debug: Query error details:', queryError.message, queryError.stack);
      throw queryError;
    }
  } catch (error) {
    console.error('Error fetching technicians:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching technicians'
    });
  }
});

/**
 * @route   GET /api/tecnicos/:id
 * @desc    Get a technician by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    console.log(`API: Fetching technician with ID: ${req.params.id}`);
    
    const technician = await Technician.findByPk(req.params.id);
    
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }
    
    // Get count of assigned clients
    const clientCount = await Client.count({
      where: {
        tecnicoId: req.params.id
      }
    });
    
    const techData = technician.get({ plain: true });
    techData.clientCount = clientCount;
    
    console.log(`API: Fetched technician: ${technician.id}`);
    return res.json({
      success: true,
      data: techData
    });
  } catch (error) {
    console.error('Error fetching technician:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching technician'
    });
  }
});

/**
 * @route   PUT /api/tecnicos/:id
 * @desc    Update a technician
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    console.log(`API: Updating technician with ID: ${req.params.id}`);
    
    // Validate request body
    const { error, value } = technicianSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Find technician
    const technician = await Technician.findByPk(req.params.id);
    
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }
    
    // Check if email is already used by another technician
    if (value.email !== technician.email) {
      const existingTechnician = await Technician.findOne({
        where: {
          email: value.email,
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existingTechnician) {
        return res.status(409).json({
          success: false,
          error: 'A technician with this email already exists'
        });
      }
    }
    
    // Update technician
    await technician.update(value);
    
    console.log(`API: Updated technician: ${technician.id}`);
    return res.json({
      success: true,
      data: technician
    });
  } catch (error) {
    console.error('Error updating technician:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error updating technician'
    });
  }
});

/**
 * @route   DELETE /api/tecnicos/:id
 * @desc    Delete a technician
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log(`API: Deleting technician with ID: ${req.params.id}`);
    
    // Find technician
    const technician = await Technician.findByPk(req.params.id);
    
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }
    
    // Check if technician has assigned clients
    const clientCount = await Client.count({
      where: {
        tecnicoId: req.params.id
      }
    });
    
    if (clientCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete technician with ${clientCount} assigned clients`
      });
    }
    
    // Delete technician
    await technician.destroy();
    
    console.log(`API: Deleted technician: ${req.params.id}`);
    return res.json({
      success: true,
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('Error deleting technician:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error deleting technician'
    });
  }
});

// Objectives Routes

/**
 * @swagger
 * /api/tecnicos/{id}/objectives:
 *   get:
 *     summary: Get all objectives for a technician
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of objectives
 */
router.get('/:id/objectives', async (req, res) => {
  try {
    const technicianId = req.params.id;
    
    const objectives = await TechnicianObjective.findAll({
      where: { technicianId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ data: objectives });
  } catch (error) {
    console.error('Error fetching technician objectives:', error);
    res.status(500).json({ error: 'Failed to fetch objectives' });
  }
});

/**
 * @swagger
 * /api/tecnicos/{id}/objectives:
 *   post:
 *     summary: Create a new objective for a technician
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Objective created
 */
router.post('/:id/objectives', async (req, res) => {
  try {
    const technicianId = req.params.id;
    
    // Check if technician exists
    const technician = await Technician.findByPk(technicianId);
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    
    // Create objective
    const objective = await TechnicianObjective.create({
      ...req.body,
      technicianId
    });
    
    res.status(201).json({ data: objective });
  } catch (error) {
    console.error('Error creating technician objective:', error);
    res.status(500).json({ error: 'Failed to create objective' });
  }
});

/**
 * @swagger
 * /api/tecnicos/{id}/objectives/{objectiveId}:
 *   put:
 *     summary: Update a technician objective
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: objectiveId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Objective updated
 *       404:
 *         description: Objective not found
 */
router.put('/:id/objectives/:objectiveId', async (req, res) => {
  try {
    const { id: technicianId, objectiveId } = req.params;
    
    // Find objective
    const objective = await TechnicianObjective.findOne({
      where: { id: objectiveId, technicianId }
    });
    
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Update objective
    await objective.update(req.body);
    
    res.json({ data: objective });
  } catch (error) {
    console.error('Error updating technician objective:', error);
    res.status(500).json({ error: 'Failed to update objective' });
  }
});

/**
 * @swagger
 * /api/tecnicos/{id}/objectives/{objectiveId}:
 *   delete:
 *     summary: Delete a technician objective
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: objectiveId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Objective deleted
 *       404:
 *         description: Objective not found
 */
router.delete('/:id/objectives/:objectiveId', async (req, res) => {
  try {
    const { id: technicianId, objectiveId } = req.params;
    
    // Find objective
    const objective = await TechnicianObjective.findOne({
      where: { id: objectiveId, technicianId }
    });
    
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Delete objective
    await objective.destroy();
    
    res.json({ message: 'Objective deleted successfully' });
  } catch (error) {
    console.error('Error deleting technician objective:', error);
    res.status(500).json({ error: 'Failed to delete objective' });
  }
});

/**
 * @swagger
 * /api/tecnicos/{id}/objectives/{objectiveId}/status:
 *   patch:
 *     summary: Update a technician objective completion status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: objectiveId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Objective not found
 */
router.patch('/:id/objectives/:objectiveId/status', async (req, res) => {
  try {
    const { id: technicianId, objectiveId } = req.params;
    const { completed } = req.body;
    
    // Find objective
    const objective = await TechnicianObjective.findOne({
      where: { id: objectiveId, technicianId }
    });
    
    if (!objective) {
      return res.status(404).json({ error: 'Objective not found' });
    }
    
    // Update status
    await objective.update({ completed });
    
    res.json({ data: objective });
  } catch (error) {
    console.error('Error updating objective status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router; 