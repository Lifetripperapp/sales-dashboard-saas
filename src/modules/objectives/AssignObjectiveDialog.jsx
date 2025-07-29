import React, { useState, useEffect } from 'react';
import useSaveQuantitativeObjective from './hooks/useSaveQuantitativeObjective';
import { formatCurrency, formatPercentage } from '../../common/utils/formatters';

/**
 * AssignObjectiveDialog component for assigning quantitative objectives to salespersons
 * 
 * @param {object} props - Component props
 * @param {object} props.objective - The objective to assign
 * @param {array} props.salespersons - Array of salespersons to choose from
 * @param {function} props.onClose - Function to call when dialog is closed
 * @param {function} props.refetch - Function to refetch objectives after save
 * @returns {JSX.Element} The dialog component
 */
const AssignObjectiveDialog = ({ objective, salespersons = [], onClose, refetch }) => {
  // Store assignments with salespersonId and individualTarget
  const [assignments, setAssignments] = useState([]);
  // Track already assigned salespersons
  const [assignedSalespersons, setAssignedSalespersons] = useState([]);
  // Track if we're showing all salespersons or only ones not assigned yet
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(true);
  // State for error message
  const [errorMessage, setErrorMessage] = useState('');
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the assign mutation
  const { assignSalespersons } = useSaveQuantitativeObjective();
  
  // Initialize already assigned salespersons
  useEffect(() => {
    if (objective && objective.salespersons) {
      // Map existing assignments
      const existing = objective.salespersons.map(sp => ({
        salespersonId: sp.id,
        individualTarget: sp.SalespersonQuantitativeObjective.individualTarget,
        assignmentId: sp.SalespersonQuantitativeObjective.id,
        alreadyAssigned: true
      }));
      
      setAssignments(existing);
      setAssignedSalespersons(objective.salespersons.map(sp => sp.id));
    }
  }, [objective]);
  
  // Format value based on objective type
  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    
    switch (objective.type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      default:
        return value.toString();
    }
  };
  
  // Handle checkbox change (select/deselect salesperson)
  const handleToggleSalesperson = (salespersonId) => {
    const isAssigned = assignments.some(a => a.salespersonId === salespersonId);
    
    if (isAssigned) {
      // Remove assignment
      setAssignments(prev => prev.filter(a => a.salespersonId !== salespersonId));
    } else {
      // Add new assignment
      const defaultTarget = objective?.isGlobal 
        ? objective.companyTarget / (salespersons.length || 1) 
        : objective.companyTarget;
      
      setAssignments(prev => [
        ...prev, 
        { 
          salespersonId, 
          individualTarget: Math.round(defaultTarget * 100) / 100, // Round to 2 decimals
          alreadyAssigned: false 
        }
      ]);
    }
  };
  
  // Handle target input change
  const handleTargetChange = (salespersonId, value) => {
    setAssignments(prev => prev.map(a => 
      a.salespersonId === salespersonId 
        ? { ...a, individualTarget: value } 
        : a
    ));
  };
  
  // Check if all assignments are valid
  const validateAssignments = () => {
    // Filter out assignments without targets
    const invalidAssignments = assignments.filter(a => 
      !a.individualTarget || 
      isNaN(parseFloat(a.individualTarget)) || 
      parseFloat(a.individualTarget) <= 0
    );
    
    if (invalidAssignments.length > 0) {
      setErrorMessage('All assignments must have a positive target value');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAssignments()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare assignment data
      const assignmentData = assignments.map(a => ({
        salespersonId: a.salespersonId,
        individualTarget: parseFloat(a.individualTarget)
      }));
      
      // Submit assignments
      await assignSalespersons.mutateAsync({
        id: objective.id,
        assignments: assignmentData
      });
      
      // Success - close the dialog and refetch
      onClose(true);
      if (refetch) refetch();
    } catch (error) {
      console.error('Assignment error:', error);
      setErrorMessage(error.message || 'Failed to assign objectives');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter salespersons based on showOnlyUnassigned setting
  const filteredSalespersons = salespersons.filter(sp => {
    if (!showOnlyUnassigned) {
      return true;
    }
    
    // Show if not already assigned from the backend
    return !assignedSalespersons.includes(sp.id);
  });
  
  // Calculate total of all individual targets
  const totalIndividualTargets = assignments.reduce(
    (sum, a) => sum + (parseFloat(a.individualTarget) || 0), 
    0
  );
  
  // Calculate difference between company target and individual targets
  const targetDifference = objective ? objective.companyTarget - totalIndividualTargets : 0;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative">
        {/* Close button */}
        <button
          onClick={() => onClose()}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close dialog"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 text-[#4A453F] border-b border-gray-200 pb-3">
            Assign Objective: {objective?.name}
          </h3>
          
          {/* Objective summary */}
          <div className="mb-4 bg-gray-50 p-3 rounded-md">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="font-medium">Type:</span> {objective?.type}
              </div>
              <div>
                <span className="font-medium">Company Target:</span> {formatValue(objective?.companyTarget)}
              </div>
              <div>
                <span className="font-medium">Minimum:</span> {objective?.minimumAcceptable ? formatValue(objective.minimumAcceptable) : 'None'}
              </div>
              <div>
                <span className="font-medium">Scope:</span> {objective?.isGlobal ? 'Global' : 'Individual'}
              </div>
            </div>
          </div>
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {errorMessage}
            </div>
          )}
          
          {/* Assignment summary */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm">
              <span className="font-medium">Assigned:</span> {assignments.length} salesperson(s)
            </div>
            <div className={`text-sm ${targetDifference < 0 ? 'text-red-600' : targetDifference > 0 ? 'text-green-600' : 'text-gray-600'}`}>
              <span className="font-medium">Difference:</span> {formatValue(targetDifference)}
            </div>
          </div>
          
          {/* Filter control */}
          <div className="mb-4 flex items-center">
            <input
              id="show-unassigned"
              type="checkbox"
              checked={showOnlyUnassigned}
              onChange={() => setShowOnlyUnassigned(prev => !prev)}
              className="h-4 w-4 text-[#F58220] focus:ring-[#F58220] border-gray-300 rounded"
            />
            <label htmlFor="show-unassigned" className="ml-2 block text-sm text-[#4A453F]">
              Show only unassigned salespersons
            </label>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Salesperson selection with individual targets */}
            <div className="mb-5 max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                      Select
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                      Salesperson
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                      Individual Target
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSalespersons.map((salesperson) => {
                    const assignment = assignments.find(a => a.salespersonId === salesperson.id);
                    const isAssigned = !!assignment;
                    
                    return (
                      <tr key={salesperson.id} className={isAssigned ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => handleToggleSalesperson(salesperson.id)}
                            className="h-4 w-4 text-[#F58220] focus:ring-[#F58220] border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#4A453F]">{salesperson.nombre}</div>
                          <div className="text-xs text-gray-500">{salesperson.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="number"
                            step={objective?.type === 'percentage' ? '0.01' : '1'}
                            min="0"
                            value={isAssigned ? assignment.individualTarget : ''}
                            onChange={(e) => handleTargetChange(salesperson.id, e.target.value)}
                            disabled={!isAssigned}
                            className={`w-full px-2 py-1 border ${
                              isAssigned ? 'border-blue-300' : 'border-gray-200 bg-gray-100'
                            } rounded focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                            placeholder={objective?.type === 'currency' ? '20000' : objective?.type === 'percentage' ? '85.00' : '10'}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  
                  {filteredSalespersons.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">
                        No {showOnlyUnassigned ? 'unassigned ' : ''}salespersons available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
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
                className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors flex items-center"
                disabled={isSubmitting || assignments.length === 0}
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Save Assignments
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignObjectiveDialog; 