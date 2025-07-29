const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const router = express.Router();
const { TechnicianEvaluation, Technician } = require('../models');

/**
 * Validation schema for creating/updating a technician evaluation
 */
const evaluationSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).required(),
  semester: Joi.string().valid('H1', 'H2').required(),
  evaluationDate: Joi.date().default(Date.now),
  status: Joi.string().valid('draft', 'final').default('draft'),
  
  // Quality & Productivity scores
  qualityAccuracy: Joi.number().integer().min(1).max(6).allow(null),
  qualityOutputQuantity: Joi.number().integer().min(1).max(6).allow(null),
  qualityOrganization: Joi.number().integer().min(1).max(6).allow(null),
  qualityUseOfTools: Joi.number().integer().min(1).max(6).allow(null),
  
  // Knowledge scores
  knowledgeTechnicalSkill: Joi.number().integer().min(1).max(6).allow(null),
  knowledgeMethods: Joi.number().integer().min(1).max(6).allow(null),
  knowledgeTools: Joi.number().integer().min(1).max(6).allow(null),
  knowledgeAutonomy: Joi.number().integer().min(1).max(6).allow(null),
  knowledgeTraining: Joi.number().integer().min(1).max(6).allow(null),
  
  // Commitment scores
  commitmentCollaboration: Joi.number().integer().min(1).max(6).allow(null),
  commitmentCommunication: Joi.number().integer().min(1).max(6).allow(null),
  commitmentProactivity: Joi.number().integer().min(1).max(6).allow(null),
  commitmentPunctuality: Joi.number().integer().min(1).max(6).allow(null),
  commitmentMotivation: Joi.number().integer().min(1).max(6).allow(null),
  
  // Attitude scores
  attitudeOpenness: Joi.number().integer().min(1).max(6).allow(null),
  attitudeAdaptability: Joi.number().integer().min(1).max(6).allow(null),
  attitudeImprovement: Joi.number().integer().min(1).max(6).allow(null),
  
  // Values scores
  valuesHonesty: Joi.number().integer().min(1).max(6).allow(null),
  valuesResponsibility: Joi.number().integer().min(1).max(6).allow(null),
  
  // Overall rating
  overallRating: Joi.number().integer().min(1).max(6).allow(null),
  
  // Comments
  supervisorComments: Joi.string().max(2000).allow('').allow(null),
  employeeComments: Joi.string().max(2000).allow('').allow(null),
  
  // Objectives
  previousObjectives: Joi.array().items(
    Joi.object({
      text: Joi.string().required(),
      completed: Joi.boolean().required()
    })
  ).allow(null),
  
  nextObjectives: Joi.array().items(
    Joi.string().max(500)
  ).allow(null),
  
  // Bonus percentage
  bonusPercentage: Joi.number().min(0).max(100).allow(null)
});

/**
 * @route   POST /api/technicians/:id/evaluations
 * @desc    Create a new evaluation for a technician
 * @access  Private
 */
router.post('/:id/evaluations', async (req, res) => {
  try {
    console.log(`API: Creating evaluation for technician ${req.params.id}`, req.body);
    
    // Validate request body
    const { error, value } = evaluationSchema.validate(req.body);
    if (error) {
      console.log('API: Validation error:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Check if technician exists
    const technician = await Technician.findByPk(req.params.id);
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }
    
    // Check if evaluation already exists for this year and semester
    const existingEvaluation = await TechnicianEvaluation.findOne({
      where: {
        technicianId: req.params.id,
        year: value.year,
        semester: value.semester
      }
    });
    
    if (existingEvaluation) {
      return res.status(409).json({
        success: false,
        error: `An evaluation already exists for ${value.year} ${value.semester}`
      });
    }
    
    // Create new evaluation
    const evaluation = await TechnicianEvaluation.create({
      ...value,
      technicianId: req.params.id
    });
    
    console.log(`API: Created evaluation ${evaluation.id} for technician ${req.params.id}`);
    return res.status(201).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error creating evaluation:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error creating evaluation'
    });
  }
});

/**
 * @route   GET /api/technicians/:id/evaluations
 * @desc    Get all evaluations for a technician with optional filters
 * @access  Private
 */
router.get('/:id/evaluations', async (req, res) => {
  try {
    console.log(`API: Fetching evaluations for technician ${req.params.id}`);
    
    // Check if technician exists
    const technician = await Technician.findByPk(req.params.id);
    if (!technician) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      });
    }
    
    // Prepare filter conditions
    const whereClause = {
      technicianId: req.params.id
    };
    
    // Add optional filters for year and semester
    if (req.query.year) {
      whereClause.year = parseInt(req.query.year, 10);
    }
    
    if (req.query.semester) {
      whereClause.semester = req.query.semester;
    }
    
    // Fetch evaluations
    const evaluations = await TechnicianEvaluation.findAll({
      where: whereClause,
      order: [['year', 'DESC'], ['semester', 'DESC']]
    });
    
    console.log(`API: Fetched ${evaluations.length} evaluations for technician ${req.params.id}`);
    return res.json({
      success: true,
      data: evaluations
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching evaluations'
    });
  }
});

/**
 * @route   GET /api/technicians/:id/evaluations/:evaluationId
 * @desc    Get a specific evaluation
 * @access  Private
 */
router.get('/:id/evaluations/:evaluationId', async (req, res) => {
  try {
    console.log(`API: Fetching evaluation ${req.params.evaluationId} for technician ${req.params.id}`);
    
    const evaluation = await TechnicianEvaluation.findOne({
      where: {
        id: req.params.evaluationId,
        technicianId: req.params.id
      }
    });
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }
    
    console.log(`API: Fetched evaluation ${req.params.evaluationId}`);
    return res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error fetching evaluation'
    });
  }
});

/**
 * @route   PUT /api/technicians/:id/evaluations/:evaluationId
 * @desc    Update an evaluation
 * @access  Private
 */
router.put('/:id/evaluations/:evaluationId', async (req, res) => {
  try {
    console.log(`API: Updating evaluation ${req.params.evaluationId} for technician ${req.params.id}`);
    
    // Validate request body
    const { error, value } = evaluationSchema.validate(req.body);
    if (error) {
      console.log('API: Validation error:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Find evaluation
    const evaluation = await TechnicianEvaluation.findOne({
      where: {
        id: req.params.evaluationId,
        technicianId: req.params.id
      }
    });
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }
    
    // Check if year and semester are being changed, and ensure no duplicate
    if (value.year !== evaluation.year || value.semester !== evaluation.semester) {
      const existingEvaluation = await TechnicianEvaluation.findOne({
        where: {
          technicianId: req.params.id,
          year: value.year,
          semester: value.semester,
          id: { [Op.ne]: req.params.evaluationId }
        }
      });
      
      if (existingEvaluation) {
        return res.status(409).json({
          success: false,
          error: `An evaluation already exists for ${value.year} ${value.semester}`
        });
      }
    }
    
    // Update evaluation
    await evaluation.update(value);
    
    console.log(`API: Updated evaluation ${req.params.evaluationId}`);
    return res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error updating evaluation:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error updating evaluation'
    });
  }
});

/**
 * @route   DELETE /api/technicians/:id/evaluations/:evaluationId
 * @desc    Delete an evaluation
 * @access  Private
 */
router.delete('/:id/evaluations/:evaluationId', async (req, res) => {
  try {
    console.log(`API: Deleting evaluation ${req.params.evaluationId} for technician ${req.params.id}`);
    
    // Find evaluation
    const evaluation = await TechnicianEvaluation.findOne({
      where: {
        id: req.params.evaluationId,
        technicianId: req.params.id
      }
    });
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found'
      });
    }
    
    // Delete evaluation
    await evaluation.destroy();
    
    console.log(`API: Deleted evaluation ${req.params.evaluationId}`);
    return res.json({
      success: true,
      message: 'Evaluation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting evaluation:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error deleting evaluation'
    });
  }
});

module.exports = router; 