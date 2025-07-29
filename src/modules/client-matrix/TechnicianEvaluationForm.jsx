import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Rating,
  Box,
  Grid,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Paper,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import useFetchTechnicianEvaluations, { useFetchLatestTechnicianEvaluation } from './hooks/useFetchTechnicianEvaluations';
import useSaveTechnicianEvaluation from './hooks/useSaveTechnicianEvaluation';
import useFetchTechnicianObjectives from './hooks/useFetchTechnicianObjectives';
import useSaveTechnicianObjective from './hooks/useSaveTechnicianObjective';
import TechnicianObjectiveManagement from './TechnicianObjectiveManagement';

// Rating labels mapping
const ratingLabels = {
  1: 'Unacceptable',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Very Good',
  6: 'Outstanding'
};

/**
 * Component to render ratings with labels
 */
const LabeledRating = ({ value, onChange, readOnly, name, label }) => {
  const [hover, setHover] = useState(-1);
  
  return (
    <Box>
      <Typography component="legend" variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Rating
          name={name}
          value={value || null}
          onChange={(event, newValue) => {
            onChange(name, newValue);
          }}
          onChangeActive={(event, newHover) => {
            setHover(newHover);
          }}
          max={6}
          size="large"
          readOnly={readOnly}
        />
        {value !== null && (
          <Box sx={{ ml: 2, minWidth: 100 }}>
            <Typography variant="body2">
              {ratingLabels[hover !== -1 ? hover : value]}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * TechnicianEvaluationForm component for creating and editing technician evaluations
 * @returns {JSX.Element} The TechnicianEvaluationForm component
 */
const TechnicianEvaluationForm = ({ technicianId }) => {
  // Current date for default values
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultSemester = currentMonth < 6 ? 'H1' : 'H2';
  
  // Form state
  const [year, setYear] = useState(currentYear);
  const [semester, setSemester] = useState(defaultSemester);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(null);
  const [newObjective, setNewObjective] = useState('');
  
  // Form data state with default values
  const [formData, setFormData] = useState({
    evaluationDate: new Date(),
    status: 'draft',
    
    // Quality & Productivity
    qualityAccuracy: null,
    qualityOutputQuantity: null,
    qualityOrganization: null,
    qualityUseOfTools: null,
    
    // Knowledge
    knowledgeTechnicalSkill: null,
    knowledgeMethods: null,
    knowledgeTools: null,
    knowledgeAutonomy: null,
    knowledgeTraining: null,
    
    // Commitment
    commitmentCollaboration: null,
    commitmentCommunication: null,
    commitmentProactivity: null,
    commitmentPunctuality: null,
    commitmentMotivation: null,
    
    // Attitude
    attitudeOpenness: null,
    attitudeAdaptability: null,
    attitudeImprovement: null,
    
    // Values
    valuesHonesty: null,
    valuesResponsibility: null,
    
    // Overall
    overallRating: null,
    
    // Comments
    supervisorComments: '',
    employeeComments: '',
    
    // Objectives
    previousObjectives: [],
    nextObjectives: [],
    
    // Bonus
    bonusPercentage: null
  });
  
  // Fetch evaluation for the selected year and semester
  const {
    data: latestEvaluation,
    isLoading: isLoadingLatestEvaluation,
    error: latestEvaluationError
  } = useFetchLatestTechnicianEvaluation(technicianId, year, semester);
  
  // Fetch all evaluations for historical view
  const {
    data: allEvaluations,
    isLoading: isLoadingAllEvaluations
  } = useFetchTechnicianEvaluations(technicianId);
  
  // Mutations for creating, updating and deleting evaluations
  const { 
    createEvaluation, 
    updateEvaluation,
    deleteEvaluation 
  } = useSaveTechnicianEvaluation();
  
  // Fetch technician objectives
  const { 
    data: objectives, 
    isLoading: isLoadingObjectives,
    refetch: refetchObjectives
  } = useFetchTechnicianObjectives(technicianId);
  
  // Get objective mutations
  const { 
    toggleCompletion: toggleObjectiveCompletion,
    deleteObjective 
  } = useSaveTechnicianObjective();
  
  // Update form when evaluation is loaded or year/semester changes
  useEffect(() => {
    if (latestEvaluation) {
      setFormData({
        evaluationDate: new Date(latestEvaluation.evaluationDate),
        status: latestEvaluation.status,
        
        // Quality & Productivity
        qualityAccuracy: latestEvaluation.qualityAccuracy,
        qualityOutputQuantity: latestEvaluation.qualityOutputQuantity,
        qualityOrganization: latestEvaluation.qualityOrganization,
        qualityUseOfTools: latestEvaluation.qualityUseOfTools,
        
        // Knowledge
        knowledgeTechnicalSkill: latestEvaluation.knowledgeTechnicalSkill,
        knowledgeMethods: latestEvaluation.knowledgeMethods,
        knowledgeTools: latestEvaluation.knowledgeTools,
        knowledgeAutonomy: latestEvaluation.knowledgeAutonomy,
        knowledgeTraining: latestEvaluation.knowledgeTraining,
        
        // Commitment
        commitmentCollaboration: latestEvaluation.commitmentCollaboration,
        commitmentCommunication: latestEvaluation.commitmentCommunication,
        commitmentProactivity: latestEvaluation.commitmentProactivity,
        commitmentPunctuality: latestEvaluation.commitmentPunctuality,
        commitmentMotivation: latestEvaluation.commitmentMotivation,
        
        // Attitude
        attitudeOpenness: latestEvaluation.attitudeOpenness,
        attitudeAdaptability: latestEvaluation.attitudeAdaptability,
        attitudeImprovement: latestEvaluation.attitudeImprovement,
        
        // Values
        valuesHonesty: latestEvaluation.valuesHonesty,
        valuesResponsibility: latestEvaluation.valuesResponsibility,
        
        // Overall
        overallRating: latestEvaluation.overallRating,
        
        // Comments
        supervisorComments: latestEvaluation.supervisorComments || '',
        employeeComments: latestEvaluation.employeeComments || '',
        
        // Objectives
        previousObjectives: latestEvaluation.previousObjectives || [],
        nextObjectives: latestEvaluation.nextObjectives || [],
        
        // Bonus
        bonusPercentage: latestEvaluation.bonusPercentage
      });
      
      setSelectedEvaluationId(latestEvaluation.id);
      // If status is final, set form to read-only
      setIsReadOnly(latestEvaluation.status === 'final');
      setIsFormDirty(false);
    } else {
      // Reset form for new evaluation
      resetForm();
      setSelectedEvaluationId(null);
      setIsReadOnly(false);
    }
  }, [latestEvaluation, year, semester]);
  
  // Reset form to default values
  const resetForm = () => {
    setFormData({
      evaluationDate: new Date(),
      status: 'draft',
      
      // Quality & Productivity
      qualityAccuracy: null,
      qualityOutputQuantity: null,
      qualityOrganization: null,
      qualityUseOfTools: null,
      
      // Knowledge
      knowledgeTechnicalSkill: null,
      knowledgeMethods: null,
      knowledgeTools: null,
      knowledgeAutonomy: null,
      knowledgeTraining: null,
      
      // Commitment
      commitmentCollaboration: null,
      commitmentCommunication: null,
      commitmentProactivity: null,
      commitmentPunctuality: null,
      commitmentMotivation: null,
      
      // Attitude
      attitudeOpenness: null,
      attitudeAdaptability: null,
      attitudeImprovement: null,
      
      // Values
      valuesHonesty: null,
      valuesResponsibility: null,
      
      // Overall
      overallRating: null,
      
      // Comments
      supervisorComments: '',
      employeeComments: '',
      
      // Objectives
      previousObjectives: [],
      nextObjectives: [],
      
      // Bonus
      bonusPercentage: null
    });
    setIsFormDirty(false);
  };
  
  // Calculate bonus percentage (example logic)
  const calculateBonus = () => {
    const ratings = [
      formData.qualityAccuracy,
      formData.qualityOutputQuantity,
      formData.qualityOrganization,
      formData.qualityUseOfTools,
      formData.knowledgeTechnicalSkill,
      formData.knowledgeMethods,
      formData.knowledgeTools,
      formData.knowledgeAutonomy,
      formData.knowledgeTraining,
      formData.commitmentCollaboration,
      formData.commitmentCommunication,
      formData.commitmentProactivity,
      formData.commitmentPunctuality,
      formData.commitmentMotivation,
      formData.attitudeOpenness,
      formData.attitudeAdaptability,
      formData.attitudeImprovement,
      formData.valuesHonesty,
      formData.valuesResponsibility
    ].filter(rating => rating !== null);
    
    if (ratings.length === 0) return 0;
    
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    // Simple bonus calculation based on average score
    let bonus = 0;
    if (average >= 5) bonus = 10; // 10% bonus for outstanding performance
    else if (average >= 4) bonus = 7; // 7% bonus for very good performance
    else if (average >= 3) bonus = 5; // 5% bonus for good performance
    else if (average >= 2) bonus = 2; // 2% bonus for fair performance
    
    return bonus;
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsFormDirty(true);
  };
  
  // Handle rating changes
  const handleRatingChange = (name, value) => {
    const updatedFormData = { ...formData, [name]: value };
    
    // Calculate overall rating as the average of all filled ratings
    const ratings = [
      updatedFormData.qualityAccuracy,
      updatedFormData.qualityOutputQuantity,
      updatedFormData.qualityOrganization,
      updatedFormData.qualityUseOfTools,
      updatedFormData.knowledgeTechnicalSkill,
      updatedFormData.knowledgeMethods,
      updatedFormData.knowledgeTools,
      updatedFormData.knowledgeAutonomy,
      updatedFormData.knowledgeTraining,
      updatedFormData.commitmentCollaboration,
      updatedFormData.commitmentCommunication,
      updatedFormData.commitmentProactivity,
      updatedFormData.commitmentPunctuality,
      updatedFormData.commitmentMotivation,
      updatedFormData.attitudeOpenness,
      updatedFormData.attitudeAdaptability,
      updatedFormData.attitudeImprovement,
      updatedFormData.valuesHonesty,
      updatedFormData.valuesResponsibility
    ].filter(rating => rating !== null);
    
    if (ratings.length > 0) {
      const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      // Round to nearest integer for consistency with rating scale
      updatedFormData.overallRating = Math.round(average);
    }
    
    setFormData(updatedFormData);
    setIsFormDirty(true);
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, evaluationDate: date }));
    setIsFormDirty(true);
  };
  
  // Handle previous objective changes
  const handlePreviousObjectiveChange = (index, completed) => {
    const updatedObjectives = [...formData.previousObjectives];
    updatedObjectives[index] = {
      ...updatedObjectives[index],
      completed
    };
    setFormData(prev => ({ ...prev, previousObjectives: updatedObjectives }));
    setIsFormDirty(true);
  };
  
  // Add new objective
  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setFormData(prev => ({
        ...prev,
        nextObjectives: [...prev.nextObjectives, newObjective.trim()]
      }));
      setNewObjective('');
      setIsFormDirty(true);
    }
  };
  
  // Remove objective
  const handleRemoveObjective = (index) => {
    const updatedObjectives = [...formData.nextObjectives];
    updatedObjectives.splice(index, 1);
    setFormData(prev => ({ ...prev, nextObjectives: updatedObjectives }));
    setIsFormDirty(true);
  };
  
  // Calculate and set bonus
  const handleCalculateBonus = () => {
    const bonus = calculateBonus();
    setFormData(prev => ({ ...prev, bonusPercentage: bonus }));
    setIsFormDirty(true);
  };
  
  // Save evaluation (draft or final)
  const handleSave = (status = 'draft') => {
    // Prepare evaluation data
    const evaluationData = {
      ...formData,
      year,
      semester,
      status,
      bonusPercentage: formData.bonusPercentage || calculateBonus()
    };
    
    if (selectedEvaluationId) {
      // Update existing evaluation
      updateEvaluation.mutate(
        {
          technicianId,
          evaluationId: selectedEvaluationId,
          evaluationData
        },
        {
          onSuccess: () => {
            alert(`Evaluation ${status === 'final' ? 'finalized' : 'saved'} successfully!`);
            setIsFormDirty(false);
            // If finalized, set form to read-only
            if (status === 'final') {
              setIsReadOnly(true);
            }
          },
          onError: (error) => {
            alert(`Error saving evaluation: ${error.message}`);
          }
        }
      );
    } else {
      // Create new evaluation
      createEvaluation.mutate(
        {
          technicianId,
          evaluationData
        },
        {
          onSuccess: (data) => {
            alert(`Evaluation ${status === 'final' ? 'finalized' : 'saved'} successfully!`);
            setSelectedEvaluationId(data.id);
            setIsFormDirty(false);
            // If finalized, set form to read-only
            if (status === 'final') {
              setIsReadOnly(true);
            }
          },
          onError: (error) => {
            alert(`Error creating evaluation: ${error.message}`);
          }
        }
      );
    }
  };
  
  // Handle year/semester selection
  const handlePeriodChange = (type, value) => {
    if (isFormDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to switch periods?')) {
        if (type === 'year') setYear(value);
        else setSemester(value);
      }
    } else {
      if (type === 'year') setYear(value);
      else setSemester(value);
    }
  };
  
  // Format evaluation card for history
  const formatEvaluationPeriod = (evaluation) => {
    return `${evaluation.year} - ${evaluation.semester}`;
  };
  
  // Add state for objectives management
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [objectiveType, setObjectiveType] = useState('next'); // 'next' or 'previous'
  
  // Handle opening objective modal
  const handleOpenObjectiveModal = (type, objective = null) => {
    setObjectiveType(type);
    setSelectedObjective(objective);
    setShowObjectiveModal(true);
  };
  
  // Handle closing objective modal
  const handleCloseObjectiveModal = () => {
    setShowObjectiveModal(false);
    setSelectedObjective(null);
    refetchObjectives();
  };
  
  // Handle toggling objective completion
  const handleToggleObjectiveCompletion = async (objectiveId, completed) => {
    try {
      await toggleObjectiveCompletion.mutateAsync({
        technicianId,
        objectiveId,
        completed: !completed
      });
    } catch (error) {
      console.error('Error toggling objective completion:', error);
      alert(`Error updating objective: ${error.message}`);
    }
  };
  
  // Handle deleting an objective
  const handleDeleteObjective = async (objectiveId) => {
    if (window.confirm('Are you sure you want to delete this objective?')) {
      try {
        await deleteObjective.mutateAsync({
          technicianId,
          objectiveId
        });
      } catch (error) {
        console.error('Error deleting objective:', error);
        alert(`Error deleting objective: ${error.message}`);
      }
    }
  };
  
  // Loading state
  if (isLoadingLatestEvaluation || isLoadingAllEvaluations || isLoadingObjectives) {
    return <Typography>Loading evaluation data...</Typography>;
  }
  
  return (
    <div>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              Technician Evaluation
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="evaluation-year-label">Evaluation Year</InputLabel>
                  <Select
                    labelId="evaluation-year-label"
                    id="evaluation-year"
                    value={year}
                    label="Evaluation Year"
                    onChange={(e) => handlePeriodChange('year', e.target.value)}
                    disabled={isReadOnly}
                  >
                    {Array.from({ length: 4 }, (_, i) => currentYear - i).map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="evaluation-semester-label">Semester</InputLabel>
                  <Select
                    labelId="evaluation-semester-label"
                    id="evaluation-semester"
                    value={semester}
                    label="Semester"
                    onChange={(e) => handlePeriodChange('semester', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <MenuItem value="H1">H1 (Jan-Jun)</MenuItem>
                    <MenuItem value="H2">H2 (Jul-Dec)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Evaluation Date"
                    value={formData.evaluationDate}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    disabled={isReadOnly}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
            
            {latestEvaluationError && (
              <Typography color="error" sx={{ mb: 2 }}>
                Error loading evaluation: {latestEvaluationError.message}
              </Typography>
            )}
            
            {!latestEvaluation && !isReadOnly && (
              <Typography sx={{ mb: 2 }}>
                No evaluation exists for {year} {semester}. Fill in the form below to create a new evaluation.
              </Typography>
            )}
            
            {isReadOnly && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                <Typography variant="body2">
                  This evaluation has been finalized and cannot be edited.
                </Typography>
              </Paper>
            )}
            
            <form>
              {/* Quality & Productivity Section */}
              <Accordion defaultExpanded>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="quality-content"
                  id="quality-header"
                >
                  <Typography sx={{ fontWeight: 'bold' }}>Quality & Productivity</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="qualityAccuracy"
                        label="Accuracy"
                        value={formData.qualityAccuracy}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="qualityOutputQuantity"
                        label="Output Quantity"
                        value={formData.qualityOutputQuantity}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="qualityOrganization"
                        label="Organization"
                        value={formData.qualityOrganization}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="qualityUseOfTools"
                        label="Use of Tools"
                        value={formData.qualityUseOfTools}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              {/* Knowledge Section */}
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="knowledge-content"
                  id="knowledge-header"
                >
                  <Typography sx={{ fontWeight: 'bold' }}>Knowledge</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="knowledgeTechnicalSkill"
                        label="Technical Skill"
                        value={formData.knowledgeTechnicalSkill}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="knowledgeMethods"
                        label="Methods"
                        value={formData.knowledgeMethods}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="knowledgeTools"
                        label="Tools"
                        value={formData.knowledgeTools}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="knowledgeAutonomy"
                        label="Autonomy"
                        value={formData.knowledgeAutonomy}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="knowledgeTraining"
                        label="Ability to Train Others"
                        value={formData.knowledgeTraining}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              {/* Commitment Section */}
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="commitment-content"
                  id="commitment-header"
                >
                  <Typography sx={{ fontWeight: 'bold' }}>Commitment</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="commitmentCollaboration"
                        label="Collaboration"
                        value={formData.commitmentCollaboration}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="commitmentCommunication"
                        label="Communication"
                        value={formData.commitmentCommunication}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="commitmentProactivity"
                        label="Proactivity"
                        value={formData.commitmentProactivity}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="commitmentPunctuality"
                        label="Punctuality"
                        value={formData.commitmentPunctuality}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="commitmentMotivation"
                        label="Motivation"
                        value={formData.commitmentMotivation}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              {/* Attitude Section */}
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="attitude-content"
                  id="attitude-header"
                >
                  <Typography sx={{ fontWeight: 'bold' }}>Attitude</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="attitudeOpenness"
                        label="Openness"
                        value={formData.attitudeOpenness}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="attitudeAdaptability"
                        label="Adaptability"
                        value={formData.attitudeAdaptability}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="attitudeImprovement"
                        label="Improvement Mindset"
                        value={formData.attitudeImprovement}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              {/* Values Section */}
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="values-content"
                  id="values-header"
                >
                  <Typography sx={{ fontWeight: 'bold' }}>Values</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="valuesHonesty"
                        label="Honesty"
                        value={formData.valuesHonesty}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LabeledRating
                        name="valuesResponsibility"
                        label="Responsibility"
                        value={formData.valuesResponsibility}
                        onChange={handleRatingChange}
                        readOnly={isReadOnly}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              {/* Overall Rating Section */}
              <Box sx={{ my: 3, py: 2, borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  Overall Rating
                </Typography>
                <LabeledRating
                  name="overallRating"
                  label="Overall Performance Rating (Auto-calculated)"
                  value={formData.overallRating}
                  onChange={() => {}} // Prevent manual changes
                  readOnly={true} // Always read-only
                />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  This rating is automatically calculated as the average of all individual ratings.
                </Typography>
              </Box>
              
              {/* Comments Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Comments
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Supervisor Comments"
                    multiline
                    rows={8}
                    name="supervisorComments"
                    value={formData.supervisorComments}
                    onChange={handleInputChange}
                    variant="outlined"
                    disabled={isReadOnly}
                  />
                  <TextField
                    fullWidth
                    label="Employee Comments"
                    multiline
                    rows={8}
                    name="employeeComments"
                    value={formData.employeeComments}
                    onChange={handleInputChange}
                    variant="outlined"
                    disabled={isReadOnly}
                  />
                </Box>
              </Box>
              
              {/* Previous Objectives Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                  Previous Objectives
                </Typography>
                
                {isLoadingObjectives ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Loading objectives...</Typography>
                  </Box>
                ) : objectives?.filter(obj => !obj.isNextObjective)?.length > 0 ? (
                  <Paper variant="outlined" sx={{ mt: 2 }}>
                    <List disablePadding>
                      {objectives
                        .filter(obj => !obj.isNextObjective)
                        .map((objective, index) => (
                          <React.Fragment key={objective.id}>
                            {index > 0 && <Divider />}
                            <ListItem
                              sx={{
                                py: 2,
                                bgcolor: objective.completed ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body1" sx={{ flex: 1 }}>
                                      {objective.text}
                                    </Typography>
                                    <Chip 
                                      size="small" 
                                      label={objective.completed ? "Completed" : "Pending"} 
                                      color={objective.completed ? "success" : "default"}
                                      sx={{ ml: 2 }}
                                    />
                                    {objective.priority && (
                                      <Chip 
                                        size="small" 
                                        label={objective.priority.charAt(0).toUpperCase() + objective.priority.slice(1)} 
                                        color={
                                          objective.priority === 'high' ? 'error' : 
                                          objective.priority === 'medium' ? 'warning' : 
                                          'info'
                                        }
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={objective.description || null}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {!isReadOnly && (
                                  <>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleOpenObjectiveModal('previous', objective)}
                                      title="Edit objective"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      color="error" 
                                      onClick={() => handleDeleteObjective(objective.id)}
                                      title="Delete objective"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                    <Checkbox
                                      edge="end"
                                      checked={objective.completed}
                                      onChange={() => handleToggleObjectiveCompletion(objective.id, objective.completed)}
                                      disabled={isReadOnly}
                                    />
                                  </>
                                )}
                              </Box>
                            </ListItem>
                          </React.Fragment>
                        ))}
                    </List>
                  </Paper>
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      No previous objectives set.
                    </Typography>
                  </Paper>
                )}
                
                {!isReadOnly && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenObjectiveModal('previous')}
                    >
                      Add Previous Objective
                    </Button>
                  </Box>
                )}
              </Box>
              
              {/* Next Objectives Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                  Next Objectives
                </Typography>
                
                {isLoadingObjectives ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Loading objectives...</Typography>
                  </Box>
                ) : objectives?.filter(obj => obj.isNextObjective)?.length > 0 ? (
                  <Paper variant="outlined">
                    <List disablePadding>
                      {objectives
                        .filter(obj => obj.isNextObjective)
                        .map((objective, index) => (
                          <React.Fragment key={objective.id}>
                            {index > 0 && <Divider />}
                            <ListItem
                              sx={{
                                py: 2,
                                bgcolor: objective.completed ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body1" sx={{ flex: 1 }}>
                                      {objective.text}
                                    </Typography>
                                    <Chip 
                                      size="small" 
                                      label={objective.completed ? "Completed" : "Pending"} 
                                      color={objective.completed ? "success" : "default"}
                                      sx={{ ml: 2 }}
                                    />
                                    {objective.priority && (
                                      <Chip 
                                        size="small" 
                                        label={objective.priority.charAt(0).toUpperCase() + objective.priority.slice(1)} 
                                        color={
                                          objective.priority === 'high' ? 'error' : 
                                          objective.priority === 'medium' ? 'warning' : 
                                          'info'
                                        }
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={objective.description || null}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {!isReadOnly && (
                                  <>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleOpenObjectiveModal('next', objective)}
                                      title="Edit objective"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      color="error" 
                                      onClick={() => handleDeleteObjective(objective.id)}
                                      title="Delete objective"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                    <Checkbox
                                      edge="end"
                                      checked={objective.completed}
                                      onChange={() => handleToggleObjectiveCompletion(objective.id, objective.completed)}
                                      disabled={isReadOnly}
                                    />
                                  </>
                                )}
                              </Box>
                            </ListItem>
                          </React.Fragment>
                        ))}
                    </List>
                  </Paper>
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      No objectives set for next period.
                    </Typography>
                  </Paper>
                )}
                
                {!isReadOnly && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenObjectiveModal('next')}
                    >
                      Add Next Objective
                    </Button>
                  </Box>
                )}
              </Box>
              
              {/* Bonus Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Bonus
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Bonus Percentage"
                      name="bonusPercentage"
                      value={formData.bonusPercentage !== null ? formData.bonusPercentage : ''}
                      onChange={handleInputChange}
                      variant="outlined"
                      type="number"
                      InputProps={{
                        endAdornment: <Typography variant="body2">%</Typography>,
                      }}
                      disabled={isReadOnly}
                    />
                    <FormHelperText>
                      Based on overall performance evaluation
                    </FormHelperText>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      onClick={handleCalculateBonus}
                      disabled={isReadOnly}
                      fullWidth
                    >
                      Calculate Suggested Bonus
                    </Button>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Action Buttons */}
              {!isReadOnly && (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleSave('draft')}
                    disabled={!isFormDirty}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSave('final')}
                  >
                    Submit Final
                  </Button>
                </Box>
              )}
            </form>
          </Box>
        </Grid>
        
        {/* Historical Evaluations Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Evaluation History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {allEvaluations && allEvaluations.length > 0 ? (
              <List>
                {allEvaluations.map((evaluation) => (
                  <ListItem
                    key={evaluation.id}
                    button
                    selected={selectedEvaluationId === evaluation.id}
                    onClick={() => {
                      if (isFormDirty) {
                        if (window.confirm('You have unsaved changes. Are you sure you want to switch evaluations?')) {
                          setYear(evaluation.year);
                          setSemester(evaluation.semester);
                        }
                      } else {
                        setYear(evaluation.year);
                        setSemester(evaluation.semester);
                      }
                    }}
                  >
                    <ListItemText
                      primary={formatEvaluationPeriod(evaluation)}
                      secondary={`Status: ${evaluation.status === 'draft' ? 'Draft' : 'Final'}`}
                    />
                    <Chip
                      size="small"
                      label={evaluation.status === 'draft' ? 'Draft' : 'Final'}
                      color={evaluation.status === 'draft' ? 'default' : 'primary'}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No evaluation history available.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Objective Management Modal */}
      {showObjectiveModal && (
        <TechnicianObjectiveManagement
          technicianId={technicianId}
          objective={selectedObjective}
          onClose={handleCloseObjectiveModal}
          objectiveType={objectiveType}
        />
      )}
    </div>
  );
};

TechnicianEvaluationForm.propTypes = {
  technicianId: PropTypes.string.isRequired
};

export default TechnicianEvaluationForm; 