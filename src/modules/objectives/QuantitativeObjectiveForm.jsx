import React, { useState, useEffect } from 'react';
import useSaveQuantitativeObjective from './hooks/useSaveQuantitativeObjective';
import { formatDate } from '../../common/utils/formatters';

/**
 * QuantitativeObjectiveForm component for creating and editing quantitative objectives
 * 
 * @param {object} props - Component props
 * @param {object} props.objective - Objective to edit (null for create)
 * @param {function} props.onClose - Function to call when the form is closed
 * @param {function} props.refetch - Function to refetch objectives after save
 * @returns {JSX.Element} The form component
 */
const QuantitativeObjectiveForm = ({ objective = null, onClose, refetch }) => {
  const isEditMode = !!objective;
  
  // Initialize form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'currency',
    companyTarget: '',
    minimumAcceptable: '',
    weight: '',
    startDate: formatDate(new Date(), 'YYYY-MM-DD'),
    endDate: formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'YYYY-MM-DD'),
    isGlobal: false
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the save mutations
  const { createObjective, updateObjective } = useSaveQuantitativeObjective();
  
  // Load objective data if in edit mode
  useEffect(() => {
    if (isEditMode && objective) {
      setFormData({
        name: objective.name || '',
        description: objective.description || '',
        type: objective.type || 'currency',
        companyTarget: objective.companyTarget || '',
        minimumAcceptable: objective.minimumAcceptable || '',
        weight: objective.weight || '',
        startDate: formatDate(objective.startDate, 'YYYY-MM-DD'),
        endDate: formatDate(objective.endDate, 'YYYY-MM-DD'),
        isGlobal: objective.isGlobal || false
      });
    }
  }, [isEditMode, objective]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }
    
    if (!formData.companyTarget || isNaN(formData.companyTarget) || parseFloat(formData.companyTarget) < 0) {
      newErrors.companyTarget = 'Company target must be a positive number';
    }
    
    if (formData.minimumAcceptable && (isNaN(formData.minimumAcceptable) || parseFloat(formData.minimumAcceptable) < 0)) {
      newErrors.minimumAcceptable = 'Minimum acceptable must be a positive number';
    }
    
    if (formData.weight && (isNaN(formData.weight) || parseFloat(formData.weight) < 0 || parseFloat(formData.weight) > 1)) {
      newErrors.weight = 'Weight must be a number between 0 and 1';
    }
    
    // Date validation - only validate if dates are provided
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formPayload = {
        ...formData,
        companyTarget: parseFloat(formData.companyTarget),
        minimumAcceptable: formData.minimumAcceptable ? parseFloat(formData.minimumAcceptable) : null,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      };
      
      if (isEditMode) {
        await updateObjective.mutateAsync({ 
          id: objective.id,
          data: formPayload
        });
      } else {
        await createObjective.mutateAsync(formPayload);
      }
      
      // Success - close the modal and refetch
      onClose(true);
      if (refetch) refetch();
    } catch (error) {
      console.error('Save error:', error);
      setErrors(prev => ({ 
        ...prev, 
        form: error.message || 'Failed to save objective' 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        {/* Header with title and close button */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-6 pb-3 flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#4A453F]">
            {isEditMode ? `Edit Objective: ${objective.name}` : 'Create New Objective'}
          </h3>
          <button
            onClick={() => onClose()}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 pt-4">
          {errors.form && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {errors.form}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Name field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-transparent`}
                  placeholder="Global Service Contract Sales 2024"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              
              {/* Type field */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.type ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-transparent`}
                >
                  <option value="currency">Currency</option>
                  <option value="percentage">Percentage</option>
                  <option value="number">Number</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
              </div>
              
              {/* Target field */}
              <div>
                <label htmlFor="companyTarget" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Company Target <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyTarget"
                  name="companyTarget"
                  type="number"
                  step={formData.type === 'percentage' ? '0.01' : '1'}
                  min="0"
                  value={formData.companyTarget}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.companyTarget ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-transparent`}
                  placeholder={formData.type === 'currency' ? '100000' : formData.type === 'percentage' ? '90.00' : '50'}
                />
                {errors.companyTarget && <p className="mt-1 text-sm text-red-500">{errors.companyTarget}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.isGlobal 
                    ? "Total target that will be distributed among salespersons" 
                    : "For individual objectives, this will match the salesperson's individual target"}
                </p>
              </div>
              
              {/* Target Explanation */}
              <div className="md:col-span-2 p-3 bg-blue-50 rounded-md mb-4 mt-2">
                <h5 className="text-sm font-medium text-blue-700 mb-1">About Targets</h5>
                <p className="text-xs text-blue-600">
                  {formData.isGlobal
                    ? "This is a global objective. You're setting the company-wide target here. When you assign this objective to salespersons, you'll set individual targets for each of them."
                    : "For individual objectives, the company target equals the individual target for this specific salesperson."}
                </p>
              </div>
              
              {/* Minimum Acceptable field */}
              <div>
                <label htmlFor="minimumAcceptable" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Minimum Acceptable
                </label>
                <input
                  id="minimumAcceptable"
                  name="minimumAcceptable"
                  type="number"
                  step={formData.type === 'percentage' ? '0.01' : '1'}
                  min="0"
                  value={formData.minimumAcceptable}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.minimumAcceptable ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-transparent`}
                  placeholder={formData.type === 'currency' ? '80000' : formData.type === 'percentage' ? '80.00' : '40'}
                />
                {errors.minimumAcceptable && <p className="mt-1 text-sm text-red-500">{errors.minimumAcceptable}</p>}
              </div>
              
              {/* Weight field */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Weight (0 - 1)
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.weight}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.weight ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-transparent`}
                  placeholder="0.4"
                />
                {errors.weight && <p className="mt-1 text-sm text-red-500">{errors.weight}</p>}
              </div>

              {/* Global option */}
              <div className="flex items-center">
                <input
                  id="isGlobal"
                  name="isGlobal"
                  type="checkbox"
                  checked={formData.isGlobal}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#F58220] focus:ring-[#F58220] border-gray-300 rounded"
                />
                <label htmlFor="isGlobal" className="ml-2 block text-sm text-[#4A453F]">
                  This is a global objective (applies to all salespersons)
                </label>
              </div>
              
              {/* Start Date field */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.startDate ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-transparent`}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
              </div>
              
              {/* End Date field */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-[#4A453F] mb-1">
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.endDate ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-transparent`}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
              </div>
              
              {/* Description field */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-200'} rounded-md focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-transparent`}
                ></textarea>
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
              </div>
            </div>
            
            {/* Submit buttons - make them sticky */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-2 z-10">
              <button
                type="button"
                onClick={() => onClose()}
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
                {isEditMode ? 'Update Objective' : 'Create Objective'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuantitativeObjectiveForm; 