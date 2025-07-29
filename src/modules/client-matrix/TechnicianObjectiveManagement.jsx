import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useSaveTechnicianObjective from './hooks/useSaveTechnicianObjective';

/**
 * TechnicianObjectiveManagement component - Modal form for creating and editing technician objectives
 * @param {Object} props - Component props
 * @param {string} props.technicianId - ID of the technician
 * @param {Object} props.objective - Objective data for editing (null for create mode)
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {string} props.objectiveType - Type of objective ('next' or 'previous')
 * @returns {JSX.Element} The TechnicianObjectiveManagement component
 */
const TechnicianObjectiveManagement = ({ technicianId, objective, onClose, objectiveType = 'next' }) => {
  // State for form data
  const [formData, setFormData] = useState({
    text: '',
    description: '',
    criteria: '',
    status: 'pendiente',
    dueDate: '',
    completionDate: '',
    completed: false,
    priority: 'medium',
    weight: '',
    evidence: '',
    isNextObjective: objectiveType === 'next',
    isGlobal: false
  });
  
  // State for form validation
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Get save objective mutation
  const { createObjective, updateObjective } = useSaveTechnicianObjective();
  
  // When objective prop changes (for edit mode), update form data
  useEffect(() => {
    if (objective) {
      setFormData({
        text: objective.text || '',
        description: objective.description || '',
        criteria: objective.criteria || '',
        status: objective.status || 'pendiente',
        dueDate: objective.dueDate ? objective.dueDate.split('T')[0] : '',
        completionDate: objective.completionDate ? objective.completionDate.split('T')[0] : '',
        completed: objective.completed || false,
        priority: objective.priority || 'medium',
        weight: objective.weight || '',
        evidence: objective.evidence || '',
        isNextObjective: objective.isNextObjective,
        isGlobal: objective.isGlobal || false
      });
    }
  }, [objective]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.text.trim()) {
      newErrors.text = 'Objective text is required';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    
    // Weight is optional but must be a valid number if provided
    if (formData.weight && (isNaN(formData.weight) || Number(formData.weight) < 0 || Number(formData.weight) > 100)) {
      newErrors.weight = 'Weight must be a number between 0 and 100';
    }
    
    // Evidence must be a valid URL if provided
    if (formData.evidence && !isValidUrl(formData.evidence)) {
      newErrors.evidence = 'Evidence must be a valid URL';
    }
    
    // If both dates are provided, ensure dueDate is before completionDate
    if (formData.dueDate && formData.completionDate && new Date(formData.dueDate) > new Date(formData.completionDate)) {
      newErrors.completionDate = 'Completion date must be after or on the due date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Check if a string is a valid URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Prepare data for API
      const objectiveData = {
        text: formData.text.trim(),
        description: formData.description.trim(),
        criteria: formData.criteria.trim(),
        status: formData.status,
        dueDate: formData.dueDate || null,
        completionDate: formData.completionDate || null,
        completed: formData.completed,
        priority: formData.priority,
        weight: formData.weight ? Number(formData.weight) : 0,
        evidence: formData.evidence.trim() || null,
        isNextObjective: formData.isNextObjective,
        isGlobal: formData.isGlobal
      };
      
      if (objective) {
        // Update existing objective
        await updateObjective.mutateAsync({
          technicianId,
          objectiveId: objective.id,
          objective: objectiveData,
        });
      } else {
        // Create new objective
        await createObjective.mutateAsync({
          technicianId,
          objective: objectiveData,
        });
      }
      
      setSubmitSuccess(true);
      
      // Auto-close after success (optional)
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving objective:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle modal close
  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          aria-label="Close modal"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <h3 className="text-xl font-bold mb-6 text-[#4A453F] border-b border-gray-200 pb-3">
            {objective ? 'Edit Objective' : 'Create New Objective'} ({objectiveType === 'next' ? 'Next Period' : 'Previous Period'})
          </h3>
          
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-md">
              Objective successfully {objective ? 'updated' : 'created'}!
            </div>
          )}
          
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-md">
              {errors.submit}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Objective Text */}
              <div>
                <label htmlFor="text" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Objective <span className="text-red-500">*</span>
                </label>
                <input
                  id="text"
                  name="text"
                  type="text"
                  value={formData.text}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.text ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                  aria-label="Objective text"
                  required
                />
                {errors.text && (
                  <p className="mt-1 text-sm text-red-500">{errors.text}</p>
                )}
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                  aria-label="Objective description"
                ></textarea>
              </div>
              
              {/* Criteria */}
              <div>
                <label htmlFor="criteria" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Success Criteria
                </label>
                <textarea
                  id="criteria"
                  name="criteria"
                  value={formData.criteria}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                  aria-label="Success criteria"
                  placeholder="Define what constitutes successful completion of this objective"
                ></textarea>
              </div>
              
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                  required
                >
                  <option value="pendiente">Pending</option>
                  <option value="en_progreso">In Progress</option>
                  <option value="completado">Completed</option>
                  <option value="no_completado">Not Completed</option>
                </select>
              </div>
              
              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                  aria-label="Due date"
                />
              </div>
              
              {/* Completion Date (shown only for completed objectives) */}
              {formData.status === 'completado' && (
                <div>
                  <label htmlFor="completionDate" className="block text-sm font-medium text-[#4A453F] mb-2">
                    Completion Date
                  </label>
                  <input
                    id="completionDate"
                    name="completionDate"
                    type="date"
                    value={formData.completionDate}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.completionDate ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                    aria-label="Completion date"
                  />
                  {errors.completionDate && (
                    <p className="mt-1 text-sm text-red-500">{errors.completionDate}</p>
                  )}
                </div>
              )}
              
              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              {/* Weight */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Weight (%)
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.weight ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                  aria-label="Objective weight"
                  placeholder="e.g. 25"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-500">{errors.weight}</p>
                )}
              </div>
              
              {/* Evidence */}
              <div>
                <label htmlFor="evidence" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Evidence URL
                </label>
                <input
                  id="evidence"
                  name="evidence"
                  type="url"
                  value={formData.evidence}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.evidence ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                  aria-label="Evidence URL"
                  placeholder="https://..."
                />
                {errors.evidence && (
                  <p className="mt-1 text-sm text-red-500">{errors.evidence}</p>
                )}
              </div>
              
              {/* Global Objective */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isGlobal"
                    checked={formData.isGlobal}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-[#F58220] focus:ring-[#F58220]"
                  />
                  <span className="text-sm font-medium text-[#4A453F]">Global Objective (applies to all technicians)</span>
                </label>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : objective ? 'Update Objective' : 'Create Objective'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

TechnicianObjectiveManagement.propTypes = {
  technicianId: PropTypes.string.isRequired,
  objective: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  objectiveType: PropTypes.oneOf(['next', 'previous']),
};

export default TechnicianObjectiveManagement; 