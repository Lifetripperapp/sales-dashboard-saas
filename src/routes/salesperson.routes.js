const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const Joi = require('joi');

const { Salesperson, Client, QuantitativeObjective, QualitativeObjective, Technician, SalespersonQuantitativeObjective } = db;

/**
 * Validate salesperson data
 * @param {Object} data - The data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} Validation result
 */
const validateSalesperson = (data, isUpdate = false) => {
  const schema = Joi.object({
    nombre: isUpdate ? Joi.string().optional() : Joi.string().required(),
    email: isUpdate 
      ? Joi.string().email().optional() 
      : Joi.string().email().required(),
    estado: isUpdate 
      ? Joi.string().valid('active', 'inactive').optional() 
      : Joi.string().valid('active', 'inactive').default('active'),
  });
  
  return schema.validate(data);
};

/**
 * @route GET /api/salespersons
 * @desc Get all salespersons with pagination and filters
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    console.log('API: Fetching salespersons with query params:', req.query);
    
    const {
      nombre,
      email,
      estado,
      page = 1,
      limit = 10,
      sortBy = 'nombre',
      sortOrder = 'asc'
    } = req.query;
    
    // Prepare filter conditions
    const whereClause = {};
    
    if (nombre) {
      whereClause.nombre = { [Op.iLike]: `%${nombre}%` };
    }
    
    if (email) {
      whereClause.email = { [Op.iLike]: `%${email}%` };
    }
    
    if (estado) {
      whereClause.estado = estado;
    }
    
    // Calculate offset for pagination
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    try {
      // Step 1: First try a basic count to see if we can query the table at all
      console.log('DEBUG: Attempting to count salespersons...');
      const count = await Salesperson.count();
      console.log('DEBUG: Count successful, found', count, 'salespersons');
      
      // Step 2: Then try a basic findAll without complex joins
      console.log('DEBUG: Attempting basic findAll...');
      const salespersons = await Salesperson.findAll({
        attributes: ['id', 'nombre', 'email', 'estado', 'createdAt', 'updatedAt'],
        raw: true
      });
      
      console.log('DEBUG: Basic findAll successful, found', salespersons.length, 'salespersons');
      
      // Step 3: Get client counts for each salesperson
      const salespersonIds = salespersons.map(salesperson => salesperson.id);
      
      // Get counts of clients per salesperson
      const clientCounts = await Client.findAll({
        attributes: [
          'vendedorId',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          vendedorId: {
            [Op.in]: salespersonIds
          }
        },
        group: ['vendedorId'],
        raw: true
      });
      
      // Create a map of salesperson ID to client count
      const countMap = {};
      clientCounts.forEach(count => {
        countMap[count.vendedorId] = parseInt(count.count, 10);
      });
      
      // Get quantitative objectives for each salesperson using the junction table
      const salespersonObjectives = await SalespersonQuantitativeObjective.findAll({
        where: {
          salespersonId: {
            [Op.in]: salespersonIds
          }
        },
        include: [
          {
            model: QuantitativeObjective,
            as: 'quantitativeObjective',
            attributes: ['id', 'type', 'companyTarget', 'weight']
          }
        ],
        raw: true,
        nest: true
      });
      
      // Group objectives by salesperson ID
      const objectivesMap = {};
      salespersonObjectives.forEach(objective => {
        if (!objectivesMap[objective.salespersonId]) {
          objectivesMap[objective.salespersonId] = [];
        }
        
        // Prepare objective data with fields in expected format
        objectivesMap[objective.salespersonId].push({
          id: objective.quantitativeObjectiveId,
          type: objective.quantitativeObjective.type,
          companyTarget: objective.quantitativeObjective.companyTarget,
          ytd: objective.currentValue || 0,
          annual: objective.individualTarget || 0,
          weight: objective.quantitativeObjective.weight || 1
        });
      });
      
      // Add client count and calculate quantitative progress for each salesperson
      const salespersonsWithData = salespersons.map(salesperson => {
        const objectives = objectivesMap[salesperson.id] || [];
        const quantitativeProgress = calculateQuantitativeProgress(objectives);
        
        return {
          ...salesperson,
          clientCount: countMap[salesperson.id] || 0,
          quantitativeProgress
        };
      });
      
      // With the basic queries working, prepare the result in the expected format
      return res.json({
        success: true,
        data: {
          count: salespersonsWithData.length,
          rows: salespersonsWithData
        }
      });
      
      /* 
       * We'll debug the more complex query after confirming the basic one works
       * The commented code below is the original complex query with joins
       */
      /*
      const salespersons = await Salesperson.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: Client,
            as: 'clients',
            attributes: ['id'],
            required: false
          },
          {
            model: QuantitativeObjective,
            as: 'quantitativeObjectives',
            attributes: ['id', 'annual', 'ytd'],
            required: false
          },
          {
            model: QualitativeObjective,
            as: 'qualitativeObjectives',
            attributes: ['id', 'status'],
            required: false
          }
        ],
        attributes: [
          'id', 
          'nombre', 
          'email', 
          'estado', 
          'createdAt', 
          'updatedAt',
          [Sequelize.fn('COUNT', Sequelize.col('clients.id')), 'clientCount']
        ],
        group: ['Salesperson.id', 'clients.id', 'quantitativeObjectives.id', 'qualitativeObjectives.id'],
      });
      */
    } catch (innerError) {
      console.error('DEBUG: Database error:', innerError);
      console.error('DEBUG: Error message:', innerError.message);
      console.error('DEBUG: Error stack:', innerError.stack);
      
      if (innerError.parent) {
        console.error('DEBUG: SQL error:', innerError.parent.message);
        console.error('DEBUG: SQL error code:', innerError.parent.code);
      }
      
      throw innerError;
    }
  } catch (error) {
    console.error('API Error: Failed to fetch salespersons', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch salespersons',
      message: error.message
    });
  }
});

/**
 * @route GET /api/salespersons/:id/basic
 * @desc Get basic salesperson details for editing
 * @access Public
 */
router.get('/:id/basic', async (req, res) => {
  try {
    console.log(`API: Fetching basic details for salesperson with ID: ${req.params.id}`);
    
    // Get basic details without complex associations
    const salesperson = await Salesperson.findByPk(req.params.id, {
      attributes: ['id', 'nombre', 'email', 'estado', 'createdAt', 'updatedAt']
    });
    
    if (!salesperson) {
      console.log(`API: Salesperson with ID ${req.params.id} not found`);
      return res.status(404).json({
        success: false,
        error: 'Salesperson not found'
      });
    }
    
    console.log(`API: Successfully fetched basic details for salesperson with ID: ${req.params.id}`);
    return res.json({
      success: true,
      data: salesperson
    });
  } catch (error) {
    console.error(`API Error: Failed to fetch basic details for salesperson with ID: ${req.params.id}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch salesperson details',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route GET /api/salespersons/:id
 * @desc Get a single salesperson by ID with details
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    console.log(`API: Fetching salesperson with ID: ${req.params.id}`);
    
    // First try a simple findByPk to check if the salesperson exists
    const simpleSalesperson = await Salesperson.findByPk(req.params.id);
    if (!simpleSalesperson) {
      console.log(`API: Salesperson with ID ${req.params.id} not found`);
      return res.status(404).json({
        success: false,
        error: 'Salesperson not found'
      });
    }
    
    console.log('Simple salesperson fetch successful, now fetching with associations');
    
    // Now try to fetch with all the associations
    const salesperson = await Salesperson.findByPk(req.params.id, {
      include: [
        {
          model: Client,
          as: 'clients',
          include: [
            { model: Technician, as: 'tecnico' }
          ]
        },
        {
          model: QualitativeObjective,
          as: 'qualitativeObjectives',
          through: { attributes: [] },  // Don't include junction table fields
          order: [['id', 'ASC']]  // Always order by ID to prevent implicit status ordering
        }
      ],
      distinct: true  // Prevent duplicate records
    });
    
    // Fetch global qualitative objectives
    const globalObjectives = await QualitativeObjective.findAll({
      where: { isGlobal: true },
      order: [['id', 'ASC']]  // Always order by ID to prevent implicit status ordering
    });
    
    // Fetch quantitative objectives for this salesperson
    const quantitativeObjectives = await SalespersonQuantitativeObjective.findAll({
      where: { salespersonId: req.params.id },
      include: [
        {
          model: QuantitativeObjective,
          as: 'quantitativeObjective',
          attributes: ['id', 'name', 'description', 'type', 'companyTarget', 'minimumAcceptable', 'weight', 'isGlobal', 'startDate', 'endDate']
        }
      ]
    });
    
    // Convert to simple objects and format for compatibility
    const formattedQuantitativeObjectives = quantitativeObjectives.map(obj => {
      const data = obj.toJSON();
      return {
        id: data.quantitativeObjective.id,
        name: data.quantitativeObjective.name,
        description: data.quantitativeObjective.description,
        type: data.quantitativeObjective.type,
        annual: data.individualTarget,
        ytd: data.currentValue,
        weight: data.quantitativeObjective.weight,
        companyTarget: data.quantitativeObjective.companyTarget,
        minimumAcceptable: data.quantitativeObjective.minimumAcceptable,
        isGlobal: data.quantitativeObjective.isGlobal,
        startDate: data.quantitativeObjective.startDate,
        endDate: data.quantitativeObjective.endDate,
        status: data.status,
        monthlyProgress: data.monthlyProgress || {}
      };
    });
    
    // Combine salesperson's objectives with global objectives
    // and ensure no duplicates by using a Map with ID as key
    const objectivesMap = new Map();
    
    // Add assigned objectives
    if (salesperson.qualitativeObjectives) {
      salesperson.qualitativeObjectives.forEach(obj => {
        objectivesMap.set(obj.id, obj);
      });
    }
    
    // Add global objectives (only if not already added)
    globalObjectives.forEach(obj => {
      if (!objectivesMap.has(obj.id)) {
        objectivesMap.set(obj.id, obj);
      }
    });
    
    // Convert Map back to array
    const allQualitativeObjectives = Array.from(objectivesMap.values());
    
    // Count services across all clients
    let serviceCount = 0;
    try {
      serviceCount = await db.ClientService.count({
        include: [
          {
            model: db.Client,
            as: 'cliente',
            where: { vendedorId: req.params.id }
          }
        ]
      });
      console.log(`Found ${serviceCount} services using standard association`);
    } catch (error) {
      console.log('Error counting services with standard method:', error.message);
      
      // Try with raw SQL query
      try {
        const result = await db.sequelize.query(`
          SELECT COUNT(*) as count FROM "ClientService" cs
          INNER JOIN "Client" c ON cs."clientId" = c.id
          WHERE c."vendedorId" = :vendedorId
        `, {
          replacements: { vendedorId: req.params.id },
          type: db.sequelize.QueryTypes.SELECT
        });
        serviceCount = parseInt(result[0].count, 10);
        console.log(`Found ${serviceCount} services using clientId column`);
      } catch (sqlError) {
        console.log('Error with SQL query:', sqlError.message);
        console.log('All service count methods failed, defaulting to 0');
        serviceCount = 0;
      }
    }
    
    // Calculate total sales (sum of quantitative objectives of type 'moneda')
    const totalSales = formattedQuantitativeObjectives
      .filter(obj => obj.type === 'currency' || obj.type === 'moneda')
      .reduce((sum, obj) => sum + (obj.ytd || 0), 0);
    
    // Calculate quantitative progress
    const quantitativeProgress = calculateQuantitativeProgress(formattedQuantitativeObjectives);
    
    // Calculate qualitative progress
    const qualitativeProgress = calculateQualitativeProgress(allQualitativeObjectives);
    
    // Prepare response
    const result = {
      id: salesperson.id,
      nombre: salesperson.nombre,
      email: salesperson.email,
      estado: salesperson.estado,
      clients: salesperson.clients,
      clientCount: salesperson.clients?.length || 0,
      quantitativeObjectives: formattedQuantitativeObjectives,
      qualitativeObjectives: allQualitativeObjectives,
      serviceCount,
      totalSales,
      quantitativeProgress,
      qualitativeProgress,
      createdAt: salesperson.createdAt,
      updatedAt: salesperson.updatedAt
    };
    
    console.log(`API: Successfully fetched salesperson with ID: ${req.params.id}`);
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`API Error: Failed to fetch salesperson with ID: ${req.params.id}`, error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.parent) {
      console.error('SQL error:', error.parent.message);
      console.error('SQL error code:', error.parent.code);
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch salesperson',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route POST /api/salespersons
 * @desc Create a new salesperson
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    console.log('API: Creating new salesperson with data:', req.body);
    
    // Validate input
    const { error, value } = validateSalesperson(req.body);
    if (error) {
      console.log('API: Validation error when creating salesperson:', error.details);
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    // Check if email already exists
    const existingSalesperson = await Salesperson.findOne({
      where: { email: value.email }
    });
    
    if (existingSalesperson) {
      console.log(`API: Email ${value.email} already in use`);
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      });
    }
    
    // Create salesperson
    const salesperson = await Salesperson.create(value);
    
    console.log(`API: Successfully created salesperson with ID: ${salesperson.id}`);
    return res.status(201).json({
      success: true,
      data: salesperson
    });
  } catch (error) {
    console.error('API Error: Failed to create salesperson', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create salesperson'
    });
  }
});

/**
 * @route PUT /api/salespersons/:id
 * @desc Update a salesperson
 * @access Public
 */
router.put('/:id', async (req, res) => {
  try {
    console.log(`API: Updating salesperson with ID: ${req.params.id}`);
    
    // Validate input
    const { error, value } = validateSalesperson(req.body, true);
    if (error) {
      console.log('API: Validation error when updating salesperson:', error.details);
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    // Find salesperson
    const salesperson = await Salesperson.findByPk(req.params.id);
    
    if (!salesperson) {
      console.log(`API: Salesperson with ID ${req.params.id} not found`);
      return res.status(404).json({
        success: false,
        error: 'Salesperson not found'
      });
    }
    
    // Check for duplicate email
    if (value.email && value.email !== salesperson.email) {
      const existingSalesperson = await Salesperson.findOne({
        where: { email: value.email }
      });
      
      if (existingSalesperson) {
        console.log(`API: Email ${value.email} already in use`);
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
      }
    }
    
    // Update salesperson
    await salesperson.update(value);
    
    console.log(`API: Successfully updated salesperson with ID: ${req.params.id}`);
    return res.json({
      success: true,
      data: salesperson
    });
  } catch (error) {
    console.error(`API Error: Failed to update salesperson with ID: ${req.params.id}`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update salesperson'
    });
  }
});

/**
 * @route DELETE /api/salespersons/:id
 * @desc Delete a salesperson and unassign their clients and objectives
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    console.log(`API: Deleting salesperson with ID: ${req.params.id}`);
    
    // Start a transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Find salesperson
      const salesperson = await Salesperson.findByPk(req.params.id, {
        include: [
          { model: Client, as: 'clients' },
          { model: QuantitativeObjective, as: 'quantitativeObjectives' },
          { model: QualitativeObjective, as: 'qualitativeObjectives' }
        ],
        transaction
      });
      
      if (!salesperson) {
        await transaction.rollback();
        console.log(`API: Salesperson with ID ${req.params.id} not found`);
        return res.status(404).json({
          success: false,
          error: 'Salesperson not found'
        });
      }
      
      console.log(`API: Salesperson found with ${salesperson.clients?.length || 0} clients, ${salesperson.quantitativeObjectives?.length || 0} quantitative objectives, and ${salesperson.qualitativeObjectives?.length || 0} qualitative objectives`);
      
      // Instead of returning an error, we'll remove the objective assignments
      let quantitativeRemoved = 0;
      let qualitativeRemoved = 0;
      
      // Remove quantitative objective assignments if any exist
      if (salesperson.quantitativeObjectives && salesperson.quantitativeObjectives.length > 0) {
        console.log(`API: Removing ${salesperson.quantitativeObjectives.length} quantitative objective assignments for salesperson ${req.params.id}`);
        try {
          const result = await db.sequelize.query(`
            DELETE FROM "SalespersonQuantitativeObjective" 
            WHERE "salespersonId" = '${req.params.id}'
            RETURNING id
          `, { transaction });
          
          quantitativeRemoved = result[0].length;
          console.log(`API: Successfully removed ${quantitativeRemoved} quantitative objective assignments`);
        } catch (error) {
          console.error('API Error: Failed to remove quantitative objective assignments:', error);
          throw new Error(`Failed to remove quantitative objective assignments: ${error.message}`);
        }
      }
      
      // Remove qualitative objective assignments if any exist
      if (salesperson.qualitativeObjectives && salesperson.qualitativeObjectives.length > 0) {
        console.log(`API: Removing ${salesperson.qualitativeObjectives.length} qualitative objective assignments for salesperson ${req.params.id}`);
        try {
          const result = await db.sequelize.query(`
            DELETE FROM "SalespersonObjective" 
            WHERE "salespersonId" = '${req.params.id}'
            RETURNING id
          `, { transaction });
          
          qualitativeRemoved = result[0].length;
          console.log(`API: Successfully removed ${qualitativeRemoved} qualitative objective assignments`);
        } catch (error) {
          console.error('API Error: Failed to remove qualitative objective assignments:', error);
          throw new Error(`Failed to remove qualitative objective assignments: ${error.message}`);
        }
      }
      
      // Unassign clients by setting vendedorId to null
      let unassignedCount = 0;
      if (salesperson.clients && salesperson.clients.length > 0) {
        console.log(`API: Unassigning ${salesperson.clients.length} clients from salesperson ${req.params.id}`);
        try {
          const updateResult = await Client.update(
            { vendedorId: null },
            { 
              where: { vendedorId: req.params.id },
              transaction
            }
          );
          unassignedCount = salesperson.clients.length;
          console.log(`API: Successfully unassigned clients from salesperson ${req.params.id}`, updateResult);
        } catch (clientUpdateError) {
          console.error('API Error: Failed to unassign clients:', clientUpdateError);
          throw new Error(`Failed to unassign clients: ${clientUpdateError.message}`);
        }
      }
      
      // Delete salesperson
      try {
        await salesperson.destroy({ transaction });
        console.log(`API: Successfully deleted salesperson with ID: ${req.params.id}`);
      } catch (destroyError) {
        console.error('API Error: Failed to destroy salesperson:', destroyError);
        throw new Error(`Failed to destroy salesperson: ${destroyError.message}`);
      }
      
      // Commit transaction
      await transaction.commit();
      
      return res.json({
        success: true,
        data: { 
          message: 'Salesperson deleted successfully',
          unassignedClients: unassignedCount,
          removedQuantitativeObjectives: quantitativeRemoved,
          removedQualitativeObjectives: qualitativeRemoved
        }
      });
    } catch (error) {
      // Rollback transaction in case of error
      if (transaction) await transaction.rollback();
      console.error(`API Transaction Error: ${error.message}`);
      throw error;
    }
  } catch (error) {
    console.error(`API Error: Failed to delete salesperson with ID: ${req.params.id}`, error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.parent) {
      console.error('SQL error:', error.parent.message);
      console.error('SQL error code:', error.parent.code);
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to delete salesperson',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/salespersons/dashboard
 * @desc Get aggregated data for dashboard
 * @access Public
 */
router.get('/dashboard', async (req, res) => {
  try {
    console.log('API: Fetching dashboard data');
    
    // Get total sales from SalespersonQuantitativeObjective with currency type objectives
    const totalSalesData = await SalespersonQuantitativeObjective.findAll({
      include: [
        {
          model: QuantitativeObjective,
          as: 'quantitativeObjective',
          where: { 
            [Op.or]: [
              { type: 'currency' },
              { type: 'moneda' }
            ] 
          },
          attributes: ['id', 'type', 'companyTarget']
        }
      ],
      attributes: ['currentValue']
    });
    
    const totalSales = totalSalesData.reduce((sum, obj) => sum + (obj.currentValue || 0), 0);
    
    // Compare with previous period (mocked for now)
    // In a real implementation, this would compare with data from previous month/quarter/year
    const salesComparison = 0.15; // Represents 15% growth
    
    // Get counts of active/inactive salespersons
    const activeSalespersons = await Salesperson.count({
      where: { estado: 'active' }
    });
    
    const inactiveSalespersons = await Salesperson.count({
      where: { estado: 'inactive' }
    });
    
    // Get total clients
    const totalClients = await Client.count();
    
    // Get counts of qualitative objectives by status
    const qualitativeStats = {
      pending: await QualitativeObjective.count({ where: { status: 'pendiente' } }),
      inProgress: await QualitativeObjective.count({ where: { status: 'en_progreso' } }),
      completed: await QualitativeObjective.count({ where: { status: 'completado' } }),
      notCompleted: await QualitativeObjective.count({ where: { status: 'no_completado' } })
    };
    
    // Calculate overall progress
    const totalQualitativeObjectives = 
      qualitativeStats.pending + 
      qualitativeStats.inProgress + 
      qualitativeStats.completed + 
      qualitativeStats.notCompleted;
    
    const qualitativeProgress = totalQualitativeObjectives > 0
      ? qualitativeStats.completed / totalQualitativeObjectives
      : 0;
    
    // Calculate quantitative progress using aggregated data
    const quantitativeObjectives = await QuantitativeObjective.findAll();
    const salespersonQuantitativeObjectives = await SalespersonQuantitativeObjective.findAll({
      include: [
        {
          model: QuantitativeObjective,
          as: 'quantitativeObjective'
        }
      ]
    });
    
    // Convert to compatible format for the existing calculation function
    const formattedObjectives = salespersonQuantitativeObjectives.map(obj => {
      const data = obj.toJSON();
      return {
        id: data.quantitativeObjective.id,
        type: data.quantitativeObjective.type,
        annual: data.individualTarget,
        ytd: data.currentValue,
        weight: data.quantitativeObjective.weight || 1
      };
    });
    
    const quantitativeProgress = calculateOverallQuantitativeProgress(formattedObjectives);
    
    // Get top performers
    const topPerformers = await getTopPerformers();
    
    // Generate monthly trends (mocked)
    const monthlyTrends = generateMockMonthlyTrends();
    
    // Prepare response
    const dashboardData = {
      totalSales,
      salesComparison,
      activeSalespersons,
      inactiveSalespersons,
      totalClients,
      qualitativeObjectiveStats: qualitativeStats,
      qualitativeProgress,
      quantitativeProgress,
      topPerformers,
      monthlyTrends
    };
    
    console.log('API: Successfully fetched dashboard data');
    return res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('API Error: Failed to fetch dashboard data', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * Calculate progress for quantitative objectives
 * @param {Array} objectives - Array of quantitative objectives
 * @returns {number} Progress as a decimal (0-1)
 */
function calculateQuantitativeProgress(objectives) {
  if (!objectives || objectives.length === 0) return 0;
  
  // Calculate weighted average of progress
  let totalWeight = 0;
  let weightedProgress = 0;
  
  objectives.forEach(objective => {
    const progress = Math.min(objective.currentValue / (objective.companyTarget || objective.annual || 1), 1);
    const weight = objective.weight || 1;
    weightedProgress += progress * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? weightedProgress / totalWeight : 0;
}

/**
 * Calculate progress for qualitative objectives
 * @param {Array} objectives - Array of qualitative objectives
 * @returns {number} Progress as a decimal (0-1)
 */
function calculateQualitativeProgress(objectives) {
  if (!objectives || objectives.length === 0) return 0;
  
  const completedCount = objectives.filter(obj => obj.status === 'completado').length;
  return completedCount / objectives.length;
}

/**
 * Calculate overall quantitative progress
 * @param {Array} objectives - Array of quantitative objectives
 * @returns {number} Progress as a decimal (0-1)
 */
function calculateOverallQuantitativeProgress(objectives) {
  if (!objectives || objectives.length === 0) return 0;
  
  // Sum YTD and annual values
  const totalYtd = objectives.reduce((sum, obj) => sum + (obj.currentValue || obj.ytd || 0), 0);
  const totalAnnual = objectives.reduce((sum, obj) => sum + (obj.companyTarget || obj.annual || 0), 0);
  
  return totalAnnual > 0 ? Math.min(totalYtd / totalAnnual, 1) : 0;
}

/**
 * Get top-performing salespersons
 * @returns {Promise<Array>} Array of top performers
 */
async function getTopPerformers() {
  // In a real implementation, this would use a more sophisticated query
  // For now, we're keeping it simple
  const salespersons = await Salesperson.findAll({
    where: { estado: 'active' },
    include: [
      { model: Client, as: 'clients' }
    ],
    limit: 5
  });
  
  // Get quantitative objectives with currency type for these salespersons
  const salespersonIds = salespersons.map(sp => sp.id);
  const objectives = await SalespersonQuantitativeObjective.findAll({
    where: { salespersonId: { [Op.in]: salespersonIds } },
    include: [
      {
        model: QuantitativeObjective,
        as: 'quantitativeObjective',
        where: { 
          [Op.or]: [
            { type: 'currency' },
            { type: 'moneda' }
          ]
        }
      }
    ]
  });
  
  // Group objectives by salesperson
  const objectivesBySalesperson = {};
  objectives.forEach(obj => {
    const data = obj.toJSON();
    if (!objectivesBySalesperson[obj.salespersonId]) {
      objectivesBySalesperson[obj.salespersonId] = [];
    }
    objectivesBySalesperson[obj.salespersonId].push({
      currentValue: data.currentValue || 0,
      individualTarget: data.individualTarget || 0
    });
  });
  
  return salespersons.map(salesperson => {
    const salesPersonObjectives = objectivesBySalesperson[salesperson.id] || [];
    
    // Calculate total sales
    const sales = salesPersonObjectives.reduce((sum, obj) => sum + obj.currentValue, 0);
    
    // Calculate target
    const target = salesPersonObjectives.reduce((sum, obj) => sum + obj.individualTarget, 0);
    
    // Calculate percentage of target
    const percentage = target > 0 ? sales / target : 0;
    
    return {
      id: salesperson.id,
      nombre: salesperson.nombre,
      sales,
      target,
      percentage,
      clientCount: salesperson.clients.length
    };
  }).sort((a, b) => b.sales - a.sales); // Sort by sales in descending order
}

/**
 * Generate mock monthly trends
 * @returns {Array} Array of monthly data
 */
function generateMockMonthlyTrends() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Get current month
  const currentMonth = new Date().getMonth();
  
  // Generate data for the last 6 months
  return Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    return {
      month: months[monthIndex],
      amount: Math.floor(Math.random() * 1000000) + 500000 // Random amount between 500k and 1.5M
    };
  });
}

/**
 * @route GET /api/salespersons/:id/objectives
 * @description Get all quantitative objectives for a specific salesperson
 * @access Public
 */
router.get('/:id/objectives', async (req, res) => {
  try {
    // Validate salesperson exists
    const salesperson = await Salesperson.findByPk(req.params.id);
    
    if (!salesperson) {
      return res.status(404).json({
        success: false,
        error: 'Salesperson not found'
      });
    }
    
    // Fetch the salesperson's explicitly assigned quantitative objectives with details
    const assignedObjectives = await SalespersonQuantitativeObjective.findAll({
      where: { salespersonId: req.params.id },
      include: [
        {
          model: QuantitativeObjective,
          as: 'quantitativeObjective',
          attributes: ['id', 'name', 'description', 'type', 'companyTarget', 'minimumAcceptable', 'weight', 'isGlobal', 'startDate', 'endDate']
        }
      ]
    });
    
    // Fetch global objectives that aren't already assigned to this salesperson
    const assignedObjectiveIds = assignedObjectives.map(obj => obj.quantitativeObjectiveId);
    
    const globalObjectives = await QuantitativeObjective.findAll({
      where: {
        isGlobal: true,
        id: {
          [Op.notIn]: assignedObjectiveIds
        }
      }
    });
    
    // Process the assigned objectives data
    const processedAssignedObjectives = assignedObjectives.map(obj => {
      const data = obj.toJSON();
      
      // Calculate completion percentage
      let completionPercentage = 0;
      if (data.individualTarget > 0) {
        completionPercentage = (data.currentValue / data.individualTarget) * 100;
      }
      
      return {
        id: data.id,
        objective: data.quantitativeObjective,
        individualTarget: data.individualTarget,
        currentValue: data.currentValue,
        completionPercentage,
        monthlyProgress: data.monthlyProgress,
        status: data.status
      };
    });
    
    // Get count of active salespersons for calculating suggested targets
    const activeSalespersonsCount = await Salesperson.count({
      where: { estado: 'active' }
    });
    
    // For unassigned global objectives, create similar structure with suggested target
    const processedGlobalObjectives = globalObjectives.map(obj => {
      // For global objectives, calculate suggested individual target as equal portion
      const data = obj.toJSON();
      const suggestedTarget = activeSalespersonsCount > 0 ? Math.round((data.companyTarget / activeSalespersonsCount) * 100) / 100 : 0;
      
      return {
        id: null, // No assignment ID yet since it's not assigned
        objective: {
          id: data.id,
          name: data.name,
          description: data.description,
          type: data.type,
          companyTarget: data.companyTarget,
          minimumAcceptable: data.minimumAcceptable,
          weight: data.weight,
          isGlobal: true,
          startDate: data.startDate,
          endDate: data.endDate
        },
        individualTarget: suggestedTarget, // Suggested target based on equal distribution
        currentValue: 0,
        completionPercentage: 0,
        monthlyProgress: {},
        status: 'pending',
        needsAssignment: true // Flag to indicate this needs to be assigned
      };
    });
    
    // Combine both arrays and send response
    const allObjectives = [...processedAssignedObjectives, ...processedGlobalObjectives];
    
    res.json({
      success: true,
      data: allObjectives
    });
  } catch (error) {
    console.error('Error fetching salesperson objectives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve salesperson objectives',
      details: error.message
    });
  }
});

/**
 * @route POST /api/salespersons/:id/objectives
 * @description Create an individual objective for a salesperson
 * @access Public
 */
router.post('/:id/objectives', async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      individualTarget,
      minimumAcceptable,
      weight,
      startDate,
      endDate
    } = req.body;
    
    // Validate required fields
    if (!name || !type || !individualTarget || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Validate salesperson exists
    const salesperson = await Salesperson.findByPk(req.params.id);
    
    if (!salesperson) {
      return res.status(404).json({
        success: false,
        error: 'Salesperson not found'
      });
    }
    
    // Create the quantitative objective
    const objective = await QuantitativeObjective.create({
      name,
      description,
      type,
      companyTarget: individualTarget, // Set company target same as individual initially
      minimumAcceptable,
      weight,
      startDate,
      endDate,
      isGlobal: false,
      status: 'pending'
    });
    
    // Create the assignment
    const assignment = await SalespersonQuantitativeObjective.create({
      salespersonId: req.params.id,
      quantitativeObjectiveId: objective.id,
      individualTarget,
      monthlyProgress: {},
      currentValue: 0,
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      data: {
        objective,
        assignment
      }
    });
  } catch (error) {
    console.error('Error creating salesperson objective:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create salesperson objective',
      details: error.message
    });
  }
});

/**
 * @route POST /api/salespersons/:id/objectives/monthly
 * @description Update monthly progress for a salesperson's objective
 * @access Public
 */
router.post('/:id/objectives/monthly', async (req, res) => {
  try {
    console.log(`API: Updating monthly progress for salesperson ${req.params.id}:`, req.body);
    const { assignmentId, month, value } = req.body;
    
    // Validate required fields
    if (!assignmentId || !month || value === undefined) {
      console.log('API: Missing required fields', { assignmentId, month, value });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Validate month format (01-12)
    if (!/^(0[1-9]|1[0-2])$/.test(month)) {
      console.log(`API: Invalid month format: ${month}`);
      return res.status(400).json({
        success: false,
        error: 'Month must be in format "01" to "12"'
      });
    }
    
    // Ensure value is a valid number
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      console.log(`API: Invalid numeric value: ${value}`);
      return res.status(400).json({
        success: false,
        error: 'Value must be a valid number'
      });
    }
    
    // Find the assignment
    const assignment = await SalespersonQuantitativeObjective.findOne({
      where: {
        id: assignmentId,
        salespersonId: req.params.id
      }
    });
    
    if (!assignment) {
      console.log(`API: Assignment not found: ${assignmentId} for salesperson: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Assignment not found for this salesperson'
      });
    }
    
    console.log(`API: Found assignment:`, {
      id: assignment.id,
      currentValue: assignment.currentValue,
      currentMonthlyProgress: assignment.monthlyProgress
    });
    
    // Update monthly progress - ensure we're working with a copy, not reference
    const monthlyProgress = { ...assignment.monthlyProgress } || {};
    monthlyProgress[month] = numericValue;
    
    console.log(`API: Updated monthlyProgress:`, monthlyProgress);
    
    // Calculate new current value (YTD)
    const currentValue = Object.values(monthlyProgress).reduce(
      (sum, val) => sum + parseFloat(val || 0), 0
    );
    
    console.log(`API: New calculated currentValue: ${currentValue}`);
    
    // Determine status based on current value and target
    let status = 'pending';
    const objective = await QuantitativeObjective.findByPk(assignment.quantitativeObjectiveId);
    
    if (currentValue > 0) {
      status = 'in_progress';
      
      if (currentValue >= assignment.individualTarget) {
        status = 'completed';
      } else if (
        objective &&
        objective.minimumAcceptable !== null &&
        new Date() > new Date(objective.endDate) &&
        currentValue < objective.minimumAcceptable
      ) {
        status = 'not_completed';
      }
    }
    
    console.log(`API: New status: ${status}`);
    
    // Update the assignment
    await assignment.update({
      monthlyProgress,
      currentValue,
      status
    });
    
    // Fetch the updated assignment to ensure we return fresh data
    const updatedAssignment = await SalespersonQuantitativeObjective.findByPk(assignment.id, {
      include: [{
        model: QuantitativeObjective,
        as: 'quantitativeObjective',
        attributes: ['id', 'name', 'type', 'companyTarget']
      }]
    });
    
    console.log(`API: Successfully updated assignment ${assignmentId}`);
    
    res.json({
      success: true,
      data: {
        id: updatedAssignment.id,
        salespersonId: updatedAssignment.salespersonId,
        objectiveId: updatedAssignment.quantitativeObjectiveId,
        monthlyProgress: updatedAssignment.monthlyProgress,
        currentValue: updatedAssignment.currentValue,
        status: updatedAssignment.status,
        objective: {
          id: updatedAssignment.quantitativeObjective.id,
          name: updatedAssignment.quantitativeObjective.name,
          type: updatedAssignment.quantitativeObjective.type
        }
      }
    });
  } catch (error) {
    console.error('Error updating monthly progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update monthly progress',
      details: error.message
    });
  }
});

module.exports = router; 