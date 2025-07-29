import React, { useState, useEffect } from 'react';
import useSaveQualitativeObjective from './hooks/useSaveQualitativeObjective';
import useUpdateQualitativeObjectiveEvidence from './hooks/useUpdateQualitativeObjectiveEvidence';
import MultiSelect from '../../common/components/MultiSelect';

/**
 * QualitativeManagement component - Modal form for creating and editing qualitative objectives
 * @param {Object} props - Component props
 * @param {Object} props.objective - Objective data for editing (null for create mode)
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {Array} props.salespersons - List of salespersons for dropdown
 * @param {string} props.defaultSalespersonId - Default salesperson ID to use when creating a new objective
 * @returns {JSX.Element} The QualitativeManagement component
 */
const QualitativeManagement = ({ objective, onClose, salespersons = [], defaultSalespersonId = '' }) => {
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: '',
    status: 'pendiente',
    dueDate: '',
    completionDate: '',
    weight: '',
    comments: '',
    evidence: '',
    salespersonIds: defaultSalespersonId ? [defaultSalespersonId] : [],
    isGlobal: false
  });
  
  // State for form validation
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Get save objective mutation
  const { createObjective, updateObjective } = useSaveQualitativeObjective();
  
  // Get update evidence mutation
  const { updateEvidence } = useUpdateQualitativeObjectiveEvidence();
  
  // When objective prop changes (for edit mode), update form data
  useEffect(() => {
    if (objective) {
      // Convert dates to input-friendly format
      const formattedDueDate = objective.dueDate 
        ? new Date(objective.dueDate).toISOString().split('T')[0]
        : '';
      
      const formattedCompletionDate = objective.completionDate
        ? new Date(objective.completionDate).toISOString().split('T')[0]
        : '';
      
      // Extract salesperson IDs from assignedSalespersons array
      const salespersonIds = objective.assignedSalespersons?.map(sp => sp.id) || [];
      
      setFormData({
        name: objective.name || '',
        description: objective.description || '',
        criteria: objective.criteria || '',
        status: objective.status || 'pendiente',
        dueDate: formattedDueDate,
        completionDate: formattedCompletionDate,
        weight: objective.weight?.toString() || '',
        comments: objective.comments || '',
        evidence: objective.evidence || '',
        salespersonIds: salespersonIds,
        isGlobal: objective.isGlobal || false
      });
    }
  }, [objective]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle salesperson selection change
  const handleSalespersonChange = (selectedIds) => {
    setFormData(prev => ({ ...prev, salespersonIds: selectedIds }));
    
    // Clear error when field is edited
    if (errors.salespersonIds) {
      setErrors(prev => ({ ...prev, salespersonIds: '' }));
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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
    
    // Salesperson selection is now optional for all objectives
    
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
    
    // Validate form
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        // Convert empty date strings to null
        dueDate: formData.dueDate ? formData.dueDate : null,
        completionDate: formData.completionDate ? formData.completionDate : null,
        // Convert weight to number
        weight: formData.weight ? Number(formData.weight) : null,
      };
      
      // Process response based on create or update
      let response;
      
      if (objective) {
        // Update existing objective
        response = await updateObjective.mutateAsync({
          id: objective.id,
          ...submissionData
        });
        console.log('Objective updated:', response);
      } else {
        // Create new objective
        response = await createObjective.mutateAsync(submissionData);
        console.log('Objective created:', response);
      }
      
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose(true); // true indicates that refresh is needed
      }, 1500);
    } catch (error) {
      console.error('Error saving objective:', error);
      setErrors({ submit: error.message || 'Failed to save objective' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle evidence update separately
  const handleEvidenceUpdate = async () => {
    if (!objective || !formData.evidence) return;
    
    if (!isValidUrl(formData.evidence)) {
      setErrors({ evidence: 'Evidence must be a valid URL' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await updateEvidence.mutateAsync({
        id: objective.id,
        evidence: formData.evidence
      });
      
      console.log('Evidence updated:', response);
      
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose(true); // true indicates that refresh is needed
      }, 1500);
    } catch (error) {
      console.error('Error updating evidence:', error);
      setErrors({ evidence: error.message || 'Failed to update evidence' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Close modal
  const handleClose = () => {
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative overflow-y-auto max-h-[90vh]">
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
            {objective ? 'Edit Qualitative Objective' : 'Create Qualitative Objective'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="mb-5 md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                  aria-label="Objective name"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              
              {/* Description */}
              <div className="mb-5 md:col-span-2">
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
              <div className="mb-5 md:col-span-2">
                <label htmlFor="criteria" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Criteria
                </label>
                <textarea
                  id="criteria"
                  name="criteria"
                  value={formData.criteria}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                  aria-label="Objective criteria"
                  placeholder="Describe the criteria for achieving this objective"
                ></textarea>
              </div>
              
              {/* Status */}
              <div className="mb-5">
                <label htmlFor="status" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.status ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                  aria-label="Objective status"
                  required
                >
                  <option value="pendiente">Pending</option>
                  <option value="en_progreso">In Progress</option>
                  <option value="completado">Completed</option>
                  <option value="no_completado">Not Completed</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-500">{errors.status}</p>
                )}
              </div>
              
              {/* Due Date */}
              <div className="mb-5">
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
              
              {/* Weight */}
              <div className="mb-5">
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
              
              {/* Completion Date (shown only in edit mode for completed objectives) */}
              {objective && formData.status === 'completado' && (
                <div className="mb-5">
                  <label htmlFor="completionDate" className="block text-sm font-medium text-[#4A453F] mb-2">
                    Completion Date
                  </label>
                  <input
                    id="completionDate"
                    name="completionDate"
                    type="date"
                    value={formData.completionDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                    aria-label="Completion date"
                  />
                </div>
              )}
              
              {/* Evidence */}
              <div className="mb-5 md:col-span-2">
                <label htmlFor="evidence" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Evidence (URL)
                </label>
                <div className="flex">
                  <input
                    id="evidence"
                    name="evidence"
                    type="url"
                    value={formData.evidence}
                    onChange={handleChange}
                    className={`flex-1 px-3 py-2 border ${errors.evidence ? 'border-red-500' : 'border-gray-200'} rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                    aria-label="Evidence URL"
                    placeholder="https://example.com/evidence"
                  />
                  {objective && (
                    <button
                      type="button"
                      onClick={handleEvidenceUpdate}
                      className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      Update Evidence
                    </button>
                  )}
                </div>
                {errors.evidence && (
                  <p className="mt-1 text-sm text-red-500">{errors.evidence}</p>
                )}
              </div>
              
              {/* Comments */}
              <div className="mb-5 md:col-span-2">
                <label htmlFor="comments" className="block text-sm font-medium text-[#4A453F] mb-2">
                  Comments
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                  aria-label="Comments"
                  placeholder="Add any additional comments about this objective"
                ></textarea>
              </div>
              
              {/* Is Global */}
              <div className="mb-5">
                <div className="flex items-center">
                  <input
                    id="isGlobal"
                    name="isGlobal"
                    type="checkbox"
                    checked={formData.isGlobal}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#F58220] focus:ring-[#F58220] rounded"
                    aria-label="Is this a global objective"
                  />
                  <label htmlFor="isGlobal" className="ml-2 block text-sm font-medium text-[#4A453F]">
                    Global Objective (applies to all salespersons)
                  </label>
                </div>
              </div>
              
              {/* Salespersons (MultiSelect) */}
              <div className={`mb-5 md:col-span-2 ${formData.isGlobal ? 'opacity-50' : ''}`}>
                <MultiSelect
                  label="Assigned Salespersons"
                  options={salespersons}
                  value={formData.salespersonIds}
                  onChange={handleSalespersonChange}
                  labelKey="nombre"
                  valueKey="id"
                  placeholder="Select salespersons..."
                  disabled={formData.isGlobal}
                  error={errors.salespersonIds}
                />
                {errors.salespersonIds && (
                  <p className="mt-1 text-sm text-red-500">{errors.salespersonIds}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#F58220] text-white px-4 py-2 rounded-md hover:bg-[#e67812] transition-colors flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {objective ? 'Update' : 'Create'} Objective
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QualitativeManagement; 