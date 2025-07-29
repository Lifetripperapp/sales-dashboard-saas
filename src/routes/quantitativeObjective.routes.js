const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { QuantitativeObjective, Salesperson, SalespersonQuantitativeObjective } = require('../models');

/**
 * @route GET /api/quantitative-objectives
 * @description Get all quantitative objectives with filters and pagination
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const nameFilter = req.query.name || '';
    const typeFilter = req.query.type || '';
    const globalFilter = req.query.isGlobal;
    const assignmentFilter = req.query.hasAssignments;
    
    // Build filter object
    const whereClause = {};
    
    if (nameFilter) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${nameFilter}%` } },
        { description: { [Op.iLike]: `%${nameFilter}%` } }
      ];
    }
    
    if (typeFilter) {
      whereClause.type = typeFilter;
    }
    
    if (globalFilter === 'true' || globalFilter === 'false') {
      whereClause.isGlobal = globalFilter === 'true';
    }
    
    // Include options to get salesperson assignments
    const includeOptions = [
      {
        model: Salesperson,
        as: 'salespersons',
        through: { attributes: ['id', 'individualTarget', 'currentValue', 'status'] }
      }
    ];
    
    // Fetch quantitative objectives with pagination
    const objectives = await QuantitativeObjective.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true // Important for correct count with associations
    });
    
    // Additional processing based on assignment filter
    let filteredObjectives = objectives.rows;
    
    if (assignmentFilter === 'assigned') {
      filteredObjectives = filteredObjectives.filter(obj => obj.salespersons.length > 0);
    } else if (assignmentFilter === 'unassigned') {
      filteredObjectives = filteredObjectives.filter(obj => obj.salespersons.length === 0);
    }
    
    // Calculate sum of individual targets and difference for each objective
    const processedObjectives = filteredObjectives.map(objective => {
      const obj = objective.toJSON();
      
      // Calculate sum of individual targets
      let sumIndividualTargets = 0;
      obj.salespersons.forEach(sp => {
        sumIndividualTargets += sp.SalespersonQuantitativeObjective.individualTarget;
      });
      
      // Calculate difference
      const difference = obj.companyTarget - sumIndividualTargets;
      
      return {
        ...obj,
        sumIndividualTargets,
        difference,
        assignedCount: obj.salespersons.length
      };
    });
    
    res.json({
      success: true,
      data: {
        count: objectives.count,
        rows: processedObjectives,
        totalPages: Math.ceil(objectives.count / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Error fetching quantitative objectives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve quantitative objectives',
      details: error.message
    });
  }
});

/**
 * @route GET /api/quantitative-objectives/:id
 * @description Get a specific quantitative objective by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const objective = await QuantitativeObjective.findByPk(req.params.id, {
      include: [
        {
          model: Salesperson,
          as: 'salespersons',
          through: {
            attributes: ['id', 'individualTarget', 'currentValue', 'monthlyProgress', 'status']
          }
        }
      ]
    });
    
    if (!objective) {
      return res.status(404).json({
        success: false,
        error: 'Quantitative objective not found'
      });
    }
    
    // Convert to plain object for additional processing
    const objData = objective.toJSON();
    
    // Calculate sum of individual targets
    let sumIndividualTargets = 0;
    objData.salespersons.forEach(sp => {
      sumIndividualTargets += sp.SalespersonQuantitativeObjective.individualTarget;
    });
    
    // Calculate difference
    const difference = objData.companyTarget - sumIndividualTargets;
    
    res.json({
      success: true,
      data: {
        ...objData,
        sumIndividualTargets,
        difference,
        assignedCount: objData.salespersons.length
      }
    });
  } catch (error) {
    console.error('Error fetching quantitative objective:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve the quantitative objective',
      details: error.message
    });
  }
});

/**
 * @route POST /api/quantitative-objectives
 * @description Create a new quantitative objective
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      companyTarget,
      minimumAcceptable,
      weight,
      startDate,
      endDate,
      isGlobal
    } = req.body;
    
    // Validate required fields
    if (!name || !type || !companyTarget || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Create new objective
    const objective = await QuantitativeObjective.create({
      name,
      description,
      type,
      companyTarget,
      minimumAcceptable,
      weight,
      startDate,
      endDate,
      isGlobal: isGlobal || false,
      status: 'pending' // Default status
    });
    
    res.status(201).json({
      success: true,
      data: objective
    });
  } catch (error) {
    console.error('Error creating quantitative objective:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create quantitative objective',
      details: error.message
    });
  }
});

/**
 * @route PUT /api/quantitative-objectives/:id
 * @description Update a quantitative objective
 * @access Public
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      companyTarget,
      minimumAcceptable,
      weight,
      startDate,
      endDate,
      isGlobal,
      status
    } = req.body;
    
    // Find the objective
    const objective = await QuantitativeObjective.findByPk(req.params.id);
    
    if (!objective) {
      return res.status(404).json({
        success: false,
        error: 'Quantitative objective not found'
      });
    }
    
    // Update the objective
    await objective.update({
      name: name || objective.name,
      description: description !== undefined ? description : objective.description,
      type: type || objective.type,
      companyTarget: companyTarget || objective.companyTarget,
      minimumAcceptable: minimumAcceptable !== undefined ? minimumAcceptable : objective.minimumAcceptable,
      weight: weight !== undefined ? weight : objective.weight,
      startDate: startDate || objective.startDate,
      endDate: endDate || objective.endDate,
      isGlobal: isGlobal !== undefined ? isGlobal : objective.isGlobal,
      status: status || objective.status
    });
    
    res.json({
      success: true,
      data: objective
    });
  } catch (error) {
    console.error('Error updating quantitative objective:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update quantitative objective',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/quantitative-objectives/:id
 * @description Delete a quantitative objective
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const objective = await QuantitativeObjective.findByPk(req.params.id);
    
    if (!objective) {
      return res.status(404).json({
        success: false,
        error: 'Quantitative objective not found'
      });
    }
    
    // Delete the objective (associated assignments will be deleted due to CASCADE)
    await objective.destroy();
    
    res.json({
      success: true,
      message: 'Quantitative objective deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quantitative objective:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete quantitative objective',
      details: error.message
    });
  }
});

/**
 * @route POST /api/quantitative-objectives/:id/assign
 * @description Assign a quantitative objective to one or more salespersons
 * @access Public
 */
router.post('/:id/assign', async (req, res) => {
  try {
    const { assignments } = req.body;
    
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignments array'
      });
    }
    
    // Validate objective exists
    const objective = await QuantitativeObjective.findByPk(req.params.id);
    
    if (!objective) {
      return res.status(404).json({
        success: false,
        error: 'Quantitative objective not found'
      });
    }
    
    // Process assignments
    const results = [];
    
    for (const assignment of assignments) {
      const { salespersonId, individualTarget } = assignment;
      
      // Validate salesperson exists
      const salesperson = await Salesperson.findByPk(salespersonId);
      
      if (!salesperson) {
        results.push({
          salespersonId,
          success: false,
          error: 'Salesperson not found'
        });
        continue;
      }
      
      // Check if assignment already exists
      const existingAssignment = await SalespersonQuantitativeObjective.findOne({
        where: {
          salespersonId,
          quantitativeObjectiveId: req.params.id
        }
      });
      
      if (existingAssignment) {
        // Update existing assignment
        await existingAssignment.update({
          individualTarget: individualTarget || existingAssignment.individualTarget
        });
        
        results.push({
          salespersonId,
          success: true,
          message: 'Assignment updated',
          data: existingAssignment
        });
      } else {
        // Create new assignment
        const newAssignment = await SalespersonQuantitativeObjective.create({
          salespersonId,
          quantitativeObjectiveId: req.params.id,
          individualTarget: individualTarget || 0,
          monthlyProgress: {},
          currentValue: 0,
          status: 'pending'
        });
        
        results.push({
          salespersonId,
          success: true,
          message: 'Assignment created',
          data: newAssignment
        });
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error assigning quantitative objective:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign quantitative objective',
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/quantitative-objectives/:id/assign/:assignmentId
 * @description Remove an assignment between objective and salesperson
 * @access Public
 */
router.delete('/:id/assign/:assignmentId', async (req, res) => {
  try {
    // Validate assignment exists
    const assignment = await SalespersonQuantitativeObjective.findOne({
      where: {
        id: req.params.assignmentId,
        quantitativeObjectiveId: req.params.id
      }
    });
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    // Delete the assignment
    await assignment.destroy();
    
    res.json({
      success: true,
      message: 'Assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove assignment',
      details: error.message
    });
  }
});

/**
 * @route POST /api/quantitative-objectives/assign-global
 * @description Assign all global objectives to all active salespersons
 * @access Public
 */
router.post('/assign-global', async (req, res) => {
  try {
    console.log('API: Starting global objectives assignment');
    
    // Find all global objectives
    const globalObjectives = await QuantitativeObjective.findAll({
      where: { isGlobal: true }
    });
    
    if (globalObjectives.length === 0) {
      console.log('API: No global objectives found to assign');
      return res.json({
        success: true,
        message: 'No global objectives found to assign',
        data: { count: 0 }
      });
    }
    
    console.log(`API: Found ${globalObjectives.length} global objectives`);
    
    // Find all active salespersons
    const salespersons = await Salesperson.findAll({
      where: { estado: 'active' }
    });
    
    if (salespersons.length === 0) {
      console.log('API: No active salespersons found');
      return res.json({
        success: true,
        message: 'No active salespersons found',
        data: { count: 0 }
      });
    }
    
    console.log(`API: Found ${salespersons.length} active salespersons`);
    
    // Create assignments for each combination
    const results = [];
    let newAssignments = 0;
    let errors = [];
    
    for (const objective of globalObjectives) {
      console.log(`API: Processing global objective: ${objective.id} - ${objective.name}`);
      
      for (const salesperson of salespersons) {
        try {
          // Check if assignment already exists
          const existingAssignment = await SalespersonQuantitativeObjective.findOne({
            where: {
              salespersonId: salesperson.id,
              quantitativeObjectiveId: objective.id
            }
          });
          
          if (!existingAssignment) {
            // Create new assignment with equal distribution of target
            const individualTarget = objective.companyTarget / salespersons.length;
            
            console.log(`API: Creating assignment for salesperson ${salesperson.id} with target ${individualTarget}`);
            
            const newAssignment = await SalespersonQuantitativeObjective.create({
              salespersonId: salesperson.id,
              quantitativeObjectiveId: objective.id,
              individualTarget,
              monthlyProgress: {},
              currentValue: 0,
              status: 'pending'
            });
            
            results.push({
              salespersonId: salesperson.id,
              objectiveId: objective.id,
              success: true,
              message: 'Assignment created'
            });
            
            newAssignments++;
          } else {
            console.log(`API: Assignment already exists for salesperson ${salesperson.id} and objective ${objective.id}`);
          }
        } catch (assignmentError) {
          console.error(`API: Error assigning objective ${objective.id} to salesperson ${salesperson.id}:`, assignmentError);
          errors.push({
            salespersonId: salesperson.id,
            objectiveId: objective.id,
            error: assignmentError.message
          });
          // Continue with the next salesperson instead of failing the whole operation
        }
      }
    }
    
    console.log(`API: Created ${newAssignments} new assignments with ${errors.length} errors`);
    
    res.json({
      success: true,
      message: `${newAssignments} new assignments created`,
      data: {
        count: newAssignments,
        details: results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Error assigning global objectives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign global objectives',
      details: error.message
    });
  }
});

/**
 * @route PATCH /api/quantitative-objectives/:id/assignment
 * @description Update the individual target for a specific assignment
 * @access Public
 * @deprecated Use /update/assignment instead
 */
router.patch('/:id/assignment', async (req, res) => {
  try {
    const { assignmentId, individualTarget } = req.body;
    
    // Validate inputs - Allow 0 but not negative
    if (!assignmentId || individualTarget === undefined || isNaN(parseFloat(individualTarget)) || parseFloat(individualTarget) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignment ID or individual target value'
      });
    }
    
    // Find the assignment without including associations to avoid alias issues
    const assignment = await SalespersonQuantitativeObjective.findByPk(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    // Update the individual target
    await assignment.update({
      individualTarget: parseFloat(individualTarget)
    });
    
    res.json({
      success: true,
      message: 'Individual target updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error updating individual target:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update individual target',
      details: error.message
    });
  }
});

/**
 * @route PATCH /api/quantitative-objectives/update/assignment
 * @description Update the individual target for a specific assignment
 * @access Public
 */
router.patch('/update/assignment', async (req, res) => {
  try {
    const { assignmentId, individualTarget } = req.body;
    
    // Validate inputs - Allow 0 but not negative
    if (!assignmentId || individualTarget === undefined || isNaN(parseFloat(individualTarget)) || parseFloat(individualTarget) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid assignment ID or individual target value'
      });
    }
    
    // Find the assignment - without including any associations
    const assignment = await SalespersonQuantitativeObjective.findByPk(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    // Update the individual target
    await assignment.update({
      individualTarget: parseFloat(individualTarget)
    });
    
    res.json({
      success: true,
      message: 'Individual target updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error updating individual target:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update individual target',
      details: error.message
    });
  }
});

module.exports = router; 