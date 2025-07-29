const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const QualitativeObjective = db.QualitativeObjective;
const Salesperson = db.Salesperson;

// GET all qualitative objectives with optional filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, salespersonId, status, isGlobal, name, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build WHERE clause based on filters
    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (isGlobal !== undefined && isGlobal !== null && isGlobal !== '') {
      whereClause.isGlobal = isGlobal === 'true';
    }
    
    if (name) {
      whereClause.name = { [Op.iLike]: `%${name}%` };
    }
    
    // Build include clause for filtering by salesperson
    const includeClause = [{
      model: Salesperson,
      as: 'assignedSalespersons',
      attributes: ['id', 'nombre', 'email'],
      through: { attributes: [] } // Don't include junction table attributes
    }];
    
    // Add where condition to the include if filtering by salesperson
    if (salespersonId) {
      includeClause[0].where = { id: salespersonId };
    }
    
    // Get total count for pagination
    const count = await QualitativeObjective.count({
      where: whereClause,
      distinct: true,
      include: salespersonId ? includeClause : []
    });
    
    // Query objectives with filters, pagination, sorting, and include salesperson
    const objectives = await QualitativeObjective.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: includeClause,
      // Important: This prevents duplicate objectives by making Sequelize create a subquery
      subQuery: false,
      distinct: true
    });
    
    console.log(`Found ${objectives.length} objectives matching criteria`);
    
    return res.json({
      success: true,
      data: {
        rows: objectives,
        totalCount: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching qualitative objectives:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch qualitative objectives',
      message: error.message
    });
  }
});

// GET a specific qualitative objective by ID
router.get('/:id', async (req, res) => {
  try {
    const objective = await QualitativeObjective.findByPk(req.params.id, {
      include: [{
        model: Salesperson,
        as: 'assignedSalespersons',
        attributes: ['id', 'nombre', 'email'],
        through: { attributes: [] } // Don't include junction table attributes
      }]
    });
    
    if (!objective) {
      return res.status(404).json({
        success: false,
        error: 'Qualitative objective not found'
      });
    }
    
    return res.json({
      success: true,
      data: objective
    });
  } catch (error) {
    console.error('Error fetching qualitative objective:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch qualitative objective',
      message: error.message
    });
  }
});

// POST create a new qualitative objective
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      criteria,
      status,
      dueDate,
      completionDate,
      weight,
      comments,
      evidence,
      isGlobal,
      salespersonIds
    } = req.body;
    
    console.log('Creating qualitative objective:', { name, isGlobal, salespersonIds });
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }
    
    // Weight validation - optional but must be valid if provided
    if (weight !== undefined && weight !== null && (isNaN(weight) || weight < 0 || weight > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Weight must be a number between 0 and 100'
      });
    }
    
    // Assigned salespersons are now optional for all objectives
    
    // Begin transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Create the objective
      const objective = await QualitativeObjective.create({
        name,
        description,
        criteria,
        status: status || 'pendiente',
        dueDate: dueDate ? new Date(dueDate) : null,
        completionDate: completionDate ? new Date(completionDate) : null,
        weight: weight || null, // Allow null weight
        comments,
        evidence,
        isGlobal: isGlobal || false,
        // For global objectives, set salespersonId to null
        // For non-global, we'll use the first salesperson ID temporarily if provided
        salespersonId: isGlobal ? null : (Array.isArray(salespersonIds) && salespersonIds.length > 0 ? salespersonIds[0] : null)
      }, { transaction });
      
      // If there are salespersons to assign
      if (Array.isArray(salespersonIds) && salespersonIds.length > 0) {
        // Create entries in the junction table
        for (const spId of salespersonIds) {
          await db.SalespersonObjective.create({
            salespersonId: spId,
            qualitativeObjectiveId: objective.id
          }, { transaction });
        }
        
        console.log(`Assigned objective to ${salespersonIds.length} salespersons`);
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Fetch the complete objective with associations
      const completeObjective = await QualitativeObjective.findByPk(objective.id, {
        include: [{
          model: Salesperson,
          as: 'assignedSalespersons',
          attributes: ['id', 'nombre', 'email'],
          through: { attributes: [] } // Don't include junction table attributes
        }]
      });
      
      return res.status(201).json({
        success: true,
        data: completeObjective
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating qualitative objective:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create qualitative objective',
      message: error.message
    });
  }
});

// PUT update a qualitative objective
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      criteria,
      status,
      dueDate,
      completionDate,
      weight,
      comments,
      evidence,
      isGlobal,
      salespersonIds
    } = req.body;
    
    // Find the objective first to ensure it exists
    const objective = await QualitativeObjective.findByPk(req.params.id);
    
    if (!objective) {
      return res.status(404).json({
        success: false,
        error: 'Qualitative objective not found'
      });
    }
    
    // Validate required fields
    if (name !== undefined && !name) {
      return res.status(400).json({
        success: false,
        error: 'Name cannot be empty'
      });
    }
    
    // Weight validation - optional but must be valid if provided
    if (weight !== undefined && weight !== null && (isNaN(weight) || weight < 0 || weight > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Weight must be a number between 0 and 100'
      });
    }
    
    // Assigned salespersons are now optional for all objectives
    
    // Begin transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Determine salespersonId based on isGlobal flag
      let salespersonId = objective.salespersonId;
      
      // Update salespersonId if isGlobal is changing
      if (isGlobal !== undefined) {
        if (isGlobal) {
          // If changing to global, set salespersonId to null
          salespersonId = null;
        } else if (Array.isArray(salespersonIds) && salespersonIds.length > 0) {
          // If changing to non-global, use first salesperson if available
          salespersonId = salespersonIds[0];
        }
      }
      
      // Update the objective
      await objective.update({
        name: name !== undefined ? name : objective.name,
        description: description !== undefined ? description : objective.description,
        criteria: criteria !== undefined ? criteria : objective.criteria,
        status: status !== undefined ? status : objective.status,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : objective.dueDate,
        completionDate: completionDate !== undefined ? (completionDate ? new Date(completionDate) : null) : objective.completionDate,
        weight: weight !== undefined ? (weight || null) : objective.weight, // Allow null weight
        comments: comments !== undefined ? comments : objective.comments,
        evidence: evidence !== undefined ? evidence : objective.evidence,
        isGlobal: isGlobal !== undefined ? isGlobal : objective.isGlobal,
        salespersonId: salespersonId
      }, { transaction });
      
      // If there are updated salesperson assignments
      if (Array.isArray(salespersonIds)) {
        // First remove all existing assignments
        await db.SalespersonObjective.destroy({
          where: {
            qualitativeObjectiveId: objective.id
          },
          transaction
        });
        
        // Then create new assignments
        if (salespersonIds.length > 0) {
          for (const spId of salespersonIds) {
            await db.SalespersonObjective.create({
              salespersonId: spId,
              qualitativeObjectiveId: objective.id
            }, { transaction });
          }
          
          console.log(`Updated objective assignments to ${salespersonIds.length} salespersons`);
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Fetch the complete objective with associations
      const completeObjective = await QualitativeObjective.findByPk(objective.id, {
        include: [{
          model: Salesperson,
          as: 'assignedSalespersons',
          attributes: ['id', 'nombre', 'email'],
          through: { attributes: [] }
        }]
      });
      
      return res.json({
        success: true,
        data: completeObjective
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating qualitative objective:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update qualitative objective',
      message: error.message
    });
  }
});

// PUT update only the status of a qualitative objective
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    // Find the objective
    const objective = await QualitativeObjective.findByPk(req.params.id);
    
    if (!objective) {
      return res.status(404).json({
        success: false,
        error: 'Qualitative objective not found'
      });
    }
    
    // Update only the status and completion date if completed
    const updates = { status };
    if (status === 'completado' && !objective.completionDate) {
      updates.completionDate = new Date();
    }
    
    await objective.update(updates);
    
    return res.json({
      success: true,
      data: objective
    });
  } catch (error) {
    console.error('Error updating qualitative objective status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update qualitative objective status',
      message: error.message
    });
  }
});

// PUT update only the evidence of a qualitative objective
router.put('/:id/evidence', async (req, res) => {
  try {
    const { evidence } = req.body;
    
    // Validate evidence
    if (!evidence) {
      return res.status(400).json({
        success: false,
        error: 'Evidence URL is required'
      });
    }
    
    // Find the objective
    const objective = await QualitativeObjective.findByPk(req.params.id);
    
    if (!objective) {
      return res.status(404).json({
        success: false,
        error: 'Qualitative objective not found'
      });
    }
    
    // Update only the evidence
    await objective.update({ evidence });
    
    return res.json({
      success: true,
      data: objective
    });
  } catch (error) {
    console.error('Error updating qualitative objective evidence:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update qualitative objective evidence',
      message: error.message
    });
  }
});

// DELETE a qualitative objective
router.delete('/:id', async (req, res) => {
  try {
    // Find the objective
    const objective = await QualitativeObjective.findByPk(req.params.id);
    
    if (!objective) {
      return res.status(404).json({
        success: false,
        error: 'Qualitative objective not found'
      });
    }
    
    // Delete the objective
    await objective.destroy();
    
    return res.json({
      success: true,
      message: 'Qualitative objective deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting qualitative objective:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete qualitative objective',
      message: error.message
    });
  }
});

module.exports = router; 