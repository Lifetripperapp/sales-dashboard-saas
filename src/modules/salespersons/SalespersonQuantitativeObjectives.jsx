import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import useFetchSalespersonObjectives from '../objectives/hooks/useFetchSalespersonObjectives';
import useUpdateMonthlyProgress from '../objectives/hooks/useUpdateMonthlyProgress';
import QuantitativeObjectiveForm from '../objectives/QuantitativeObjectiveForm';
import { formatCurrency, formatPercentage, formatDate } from '../../common/utils/formatters';
import { buildApiUrl } from '../../common/utils/apiConfig';
import { authFetch } from '../../common/utils/fetch-wrapper';

/**
 * MonthlyProgressInputs component for rendering monthly inputs for an objective
 */
const MonthlyProgressInputs = ({ objective, handleUpdateProgress }) => {
  // Get months array for the current year
  const months = [
    { num: '01', name: 'January' },
    { num: '02', name: 'February' },
    { num: '03', name: 'March' },
    { num: '04', name: 'April' },
    { num: '05', name: 'May' },
    { num: '06', name: 'June' },
    { num: '07', name: 'July' },
    { num: '08', name: 'August' },
    { num: '09', name: 'September' },
    { num: '10', name: 'October' },
    { num: '11', name: 'November' },
    { num: '12', name: 'December' }
  ];
  
  const [inputValues, setInputValues] = useState({});
  const [updatingMonth, setUpdatingMonth] = useState(null);
  
  // Initialize input values from objective data on first render
  useEffect(() => {
    const initialValues = {};
    months.forEach(month => {
      initialValues[month.num] = objective.monthlyProgress?.[month.num] || '';
    });
    setInputValues(initialValues);
  }, [objective.id]);
  
  const handleInputChange = (month, value) => {
    setInputValues(prev => ({
      ...prev,
      [month]: value
    }));
  };
  
  const handleSaveValue = async (month) => {
    const value = inputValues[month];
    const currentValue = objective.monthlyProgress?.[month] || 0;
    
    // Only update if the value has changed
    if (value !== '' && parseFloat(value) !== currentValue) {
      setUpdatingMonth(month);
      await handleUpdateProgress(objective.id, month, value || 0);
      setUpdatingMonth(null);
    }
  };
  
  // Format value based on type
  const formatValue = (value, type) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      default:
        return value.toString();
    }
  };
  
  return (
    <div className="mt-4 overflow-x-auto">
      {/* Two-line compact month display layout */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Month names row */}
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200">
          {months.map(month => (
            <div key={`name-${month.num}`} className="px-2 py-1 text-center text-xs font-medium text-[#4A453F]">
              {month.name.substring(0, 3)}
            </div>
          ))}
        </div>
        
        {/* Input fields row */}
        <div className="grid grid-cols-12">
          {months.map(month => {
            const currentValue = objective.monthlyProgress?.[month.num] || 0;
            const isUpdating = updatingMonth === month.num;
            
            return (
              <div key={`input-${month.num}`} className="p-1 border-r border-gray-100 last:border-r-0">
                <div className="text-xs text-center text-gray-500 mb-1">
                  {formatValue(currentValue, objective.objective.type)}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    className={`w-full px-1 py-1 border ${isUpdating ? 'border-[#F58220]' : 'border-gray-300'} rounded-sm text-right text-xs`}
                    placeholder="0"
                    step={objective.objective.type === 'percentage' ? '0.01' : '1'}
                    min="0"
                    value={inputValues[month.num] || ''}
                    onChange={(e) => handleInputChange(month.num, e.target.value)}
                    onBlur={() => handleSaveValue(month.num)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveValue(month.num);
                      }
                    }}
                  />
                  {isUpdating && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-40 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-[#F58220] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * SalespersonQuantitativeObjectives component for displaying and managing quantitative objectives for a salesperson
 * 
 * @param {object} props - Component props
 * @param {string} props.salespersonId - ID of the salesperson
 * @param {string} props.salespersonName - Name of the salesperson
 * @returns {JSX.Element} The component
 */
const SalespersonQuantitativeObjectives = ({ salespersonId, salespersonName }) => {
  // State for modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExpandedObjective, setShowExpandedObjective] = useState(null);
  const [orderedObjectives, setOrderedObjectives] = useState([]);
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingTargetValue, setEditingTargetValue] = useState('');
  
  // Fetch objectives for this salesperson
  const {
    data: objectives,
    isLoading,
    error,
    refetch
  } = useFetchSalespersonObjectives(salespersonId);
  
  // Initialize ordered objectives when data is loaded
  useEffect(() => {
    if (objectives) {
      setOrderedObjectives([...objectives]);
    }
  }, [objectives]);
  
  // Function to move an objective up or down in the list
  const moveObjective = (index, direction) => {
    const newObjectives = [...orderedObjectives];
    if (direction === 'up' && index > 0) {
      // Swap with previous item
      [newObjectives[index], newObjectives[index - 1]] = [newObjectives[index - 1], newObjectives[index]];
      setOrderedObjectives(newObjectives);
    } else if (direction === 'down' && index < newObjectives.length - 1) {
      // Swap with next item
      [newObjectives[index], newObjectives[index + 1]] = [newObjectives[index + 1], newObjectives[index]];
      setOrderedObjectives(newObjectives);
    }
  };
  
  // Get the mutation for updating monthly progress
  const updateProgress = useUpdateMonthlyProgress();
  
  // Delete assignment mutation
  const deleteAssignment = useMutation({
    mutationFn: async ({ objectiveId, assignmentId }) => {
      const data = await authFetch(`/api/quantitative-objectives/${objectiveId}/assign/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return data;
    },
    onSuccess: () => {
      refetch();
    }
  });
  
  // Handle form toggle
  const handleToggleCreateModal = () => {
    setShowCreateModal(prev => !prev);
  };
  
  // Handle monthly progress update
  const handleUpdateProgress = async (assignmentId, month, value) => {
    try {
      console.log(`Updating progress for assignment ${assignmentId}, month ${month}, value ${value}`);
      
      await updateProgress.mutateAsync({
        salespersonId,
        assignmentId,
        month,
        value: parseFloat(value)
      });
      
      console.log('Progress updated successfully');
      // Refetch to ensure we have the latest data
      await refetch();
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert(`Failed to update progress: ${error.message}`);
    }
  };
  
  // Handle assignment deletion
  const handleDeleteAssignment = async (objectiveId, assignmentId, objectiveName) => {
    if (window.confirm(`Are you sure you want to remove "${objectiveName}" from this salesperson? This will delete all progress data.`)) {
      try {
        await deleteAssignment.mutateAsync({ objectiveId, assignmentId });
      } catch (error) {
        console.error('Failed to delete assignment:', error);
        alert(`Failed to delete assignment: ${error.message}`);
      }
    }
  };
  
  // Toggle objective expansion to show monthly inputs
  const toggleObjectiveExpansion = (objectiveId) => {
    setShowExpandedObjective(prev => prev === objectiveId ? null : objectiveId);
  };
  
  // Format value based on type
  const formatValue = (value, type) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      default:
        return value.toString();
    }
  };
  
  // Get color class based on completion percentage
  const getProgressColorClass = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Render loading state
  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent"></div>
        <p className="mt-4 text-lg text-[#4A453F]">Loading objectives...</p>
      </div>
    </div>
  );
  
  // Render error state
  const renderError = () => (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="text-center text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-xl font-semibold mb-2">Error Loading Objectives</h3>
        <p className="text-gray-600">{error?.message || 'Failed to load quantitative objectives'}</p>
      </div>
    </div>
  );
  
  // Render empty state
  const renderEmpty = () => (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <h3 className="text-xl font-semibold mb-2">No Objectives Found</h3>
        <p className="text-gray-600 mb-4">There are no quantitative objectives assigned to this salesperson.</p>
        <button
          onClick={handleToggleCreateModal}
          className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors"
        >
          + Create New Objective
        </button>
      </div>
    </div>
  );
  
  // Handle assigning a global objective to this salesperson
  const [assigningObjective, setAssigningObjective] = useState(null);
  const [assignmentValues, setAssignmentValues] = useState({}); // Object to store values for each objective
  
  // Mutation for assigning an objective to a salesperson
  const assignObjective = useMutation({
    mutationFn: async ({ objectiveId, individualTarget }) => {
      console.log(`Assigning objective ${objectiveId} to salesperson ${salespersonId} with target ${individualTarget}`);
      
      const data = await authFetch(`/api/quantitative-objectives/${objectiveId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          assignments: [{ 
            salespersonId, 
            individualTarget 
          }] 
        })
      });
      
      return data;
    },
    onSuccess: (data) => {
      console.log('Assignment successful:', data);
      setAssigningObjective(null);
      refetch();
    },
    onError: (error) => {
      console.error('Assignment error:', error);
      alert(`Failed to assign objective: ${error.message}`);
    }
  });
  
  const handleAssignObjective = async (objectiveId) => {
    const assignmentValue = assignmentValues[objectiveId] || '';
    if (assignmentValue === '' || isNaN(parseFloat(assignmentValue)) || parseFloat(assignmentValue) < 0) {
      alert('Please enter a valid target value greater than or equal to zero');
      return;
    }
    
    try {
      await assignObjective.mutateAsync({
        objectiveId,
        individualTarget: parseFloat(assignmentValue)
      });
      // Clear the value for this objective after successful assignment
      setAssignmentValues(prev => {
        const newValues = { ...prev };
        delete newValues[objectiveId];
        return newValues;
      });
    } catch (error) {
      // Error is already handled in onError callback
      console.error('Assignment failed:', error);
    }
  };
  
  // Mutation for updating individual target
  const updateIndividualTarget = useMutation({
    mutationFn: async ({ assignmentId, individualTarget }) => {
      // Get the objective ID from the URL - since the endpoint is /:id/assignment
      // Use a fixed ID for the URL parameter since we're sending the assignmentId in the body
      const data = await authFetch(`/api/quantitative-objectives/update/assignment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignmentId, individualTarget })
      });
      
      return data;
    },
    onSuccess: () => {
      setEditingTarget(null);
      setEditingTargetValue('');
      refetch();
    },
    onError: (error) => {
      console.error('Update target error:', error);
      alert(`Failed to update target: ${error.message}`);
    }
  });

  // Handle starting target edit
  const handleStartEditTarget = (objective) => {
    // Only allow editing for assigned objectives (not unassigned ones)
    if (objective.needsAssignment) {
      alert('Please assign this objective first before editing the target');
      return;
    }
    setEditingTarget(objective.objective.id);
    setEditingTargetValue(objective.individualTarget.toString());
  };
  
  // Handle saving target edit
  const handleSaveTargetEdit = async (assignmentId) => {
    if (editingTargetValue === '' || isNaN(parseFloat(editingTargetValue)) || parseFloat(editingTargetValue) < 0) {
      alert('Please enter a valid target value greater than or equal to zero');
      return;
    }
    
    try {
      await updateIndividualTarget.mutateAsync({
        assignmentId,
        individualTarget: parseFloat(editingTargetValue)
      });
    } catch (error) {
      // Error is already handled in onError callback
      console.error('Target update failed:', error);
    }
  };
  
  // Replace the renderObjectiveCard function with a more structured table-like layout
  const renderObjectiveCard = (objective, index) => {
    const { objective: obj, individualTarget, currentValue, completionPercentage, status } = objective;
    const isUnassigned = objective.needsAssignment;
    
    return (
      <div key={obj.id} className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 overflow-hidden">
        {/* Main objective info row with grid layout */}
        <div className="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-100">
          {/* Order controls - 1 column */}
          <div className="col-span-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <button
                onClick={() => moveObjective(index, 'up')}
                disabled={index === 0}
                className={`w-6 h-6 mb-1 flex items-center justify-center rounded ${
                  index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Move up"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveObjective(index, 'down')}
                disabled={index === orderedObjectives.length - 1}
                className={`w-6 h-6 flex items-center justify-center rounded ${
                  index === orderedObjectives.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Move down"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Name and badges - 3 columns */}
          <div className="col-span-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-[#4A453F]">{obj.name}</h4>
              <div className="flex gap-1">
                {obj.isGlobal && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Global
                  </span>
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${obj.type === 'currency' ? 'bg-green-100 text-green-700' : obj.type === 'percentage' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}
                </span>
              </div>
            </div>
            {obj.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{obj.description}</p>}
          </div>
          
          {/* Individual Target - 1 column */}
          <div className="col-span-1 text-center">
            <span className="text-xs text-gray-500 block">
              {isUnassigned ? 'Suggested' : 'Target'}
            </span>
            {editingTarget === obj.id ? (
              <div className="flex items-center mt-1">
                <input
                  type="number"
                  className="px-2 py-1 w-full border border-[#F58220] rounded-md text-sm"
                  step={obj.type === 'percentage' ? '0.01' : '1'}
                  min="0"
                  value={editingTargetValue}
                  onChange={(e) => setEditingTargetValue(e.target.value)}
                />
              </div>
            ) : (
              <span className={`font-semibold text-sm ${isUnassigned ? 'text-blue-600' : ''}`}>
                {formatValue(individualTarget, obj.type)}
              </span>
            )}
          </div>
          
          {/* Company Target - 1 column */}
          <div className="col-span-1 text-center">
            <span className="text-xs text-gray-500 block">Company</span>
            <span className="font-semibold text-sm">
              {formatValue(obj.companyTarget, obj.type)}
            </span>
          </div>
          
          {/* Current value - 1 column */}
          <div className="col-span-1 text-center">
            <span className="text-xs text-gray-500 block">YTD</span>
            <span className="font-semibold text-sm">
              {isUnassigned ? '-' : formatValue(currentValue, obj.type)}
            </span>
          </div>
          
          {/* Status - 1 column */}
          <div className="col-span-1 text-center">
            <span className="text-xs text-gray-500 block">Status</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              status === 'completed' ? 'bg-green-100 text-green-700' : 
              status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
              status === 'not_completed' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {status === 'pending' ? 'Pending' :
              status === 'in_progress' ? 'In Progress' :
              status === 'completed' ? 'Completed' : 'Not Completed'}
            </span>
          </div>
          
          {/* Progress - 1 column */}
          <div className="col-span-1 text-center">
            {!isUnassigned && (
              <>
                <span className="text-xs text-gray-500 block">Progress</span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getProgressColorClass(completionPercentage)} h-2 rounded-full`}
                      style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium">{completionPercentage.toFixed(0)}%</span>
                </div>
              </>
            )}
          </div>
          
          {/* Edit buttons - 1 column */}
          <div className="col-span-1 flex justify-center">
            {editingTarget === obj.id ? (
              <div className="flex space-x-1">
                <button
                  onClick={() => handleSaveTargetEdit(objective.id)}
                  className="p-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  disabled={updateIndividualTarget.isPending}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setEditingTarget(null);
                    setEditingTargetValue('');
                  }}
                  className="p-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : !isUnassigned && (
              <button
                onClick={() => handleStartEditTarget(objective)}
                className="p-1 text-gray-500 hover:text-[#F58220] hover:bg-gray-100 rounded-md"
                title="Edit individual target"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Actions buttons - 2 columns */}
          <div className="col-span-2 flex space-x-1 justify-end">
            {isUnassigned ? (
              assigningObjective === obj.id ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-right text-sm"
                    placeholder="Target"
                    step={obj.type === 'percentage' ? '0.01' : '1'}
                    min="0"
                    value={assignmentValues[obj.id] || ''}
                    onChange={(e) => setAssignmentValues(prev => ({
                      ...prev,
                      [obj.id]: e.target.value
                    }))}
                  />
                  <button
                    onClick={() => handleAssignObjective(obj.id)}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    disabled={assignObjective.isPending}
                  >
                    {assignObjective.isPending ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setAssigningObjective(null);
                      setAssignmentValues(prev => {
                        const newValues = { ...prev };
                        delete newValues[obj.id];
                        return newValues;
                      });
                    }}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAssigningObjective(obj.id);
                    // Pre-fill with suggested target
                    setAssignmentValues(prev => ({
                      ...prev,
                      [obj.id]: individualTarget.toString()
                    }));
                  }}
                  className="px-2 py-1 text-xs bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors"
                >
                  Assign
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => toggleObjectiveExpansion(obj.id)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {showExpandedObjective === obj.id ? 'Hide' : 'Details'}
                </button>
                
                <button
                  onClick={() => handleDeleteAssignment(obj.id, objective.id, obj.name)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Expanded monthly inputs */}
        {!isUnassigned && showExpandedObjective === obj.id && (
          <div className="p-3 bg-gray-50">
            {/* Target details section */}
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <h5 className="text-sm font-medium text-[#4A453F] mb-2">Target Information</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Individual Target</p>
                  {editingTarget === obj.id ? (
                    <div className="flex items-center mt-1">
                      <input
                        type="number"
                        className="px-2 py-1 w-32 border border-[#F58220] rounded-md text-sm"
                        step={obj.type === 'percentage' ? '0.01' : '1'}
                        min="0"
                        value={editingTargetValue}
                        onChange={(e) => setEditingTargetValue(e.target.value)}
                      />
                      <div className="flex ml-2">
                        <button
                          onClick={() => handleSaveTargetEdit(objective.id)}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded-md mr-1"
                          disabled={updateIndividualTarget.isPending}
                        >
                          {updateIndividualTarget.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingTarget(null);
                            setEditingTargetValue('');
                          }}
                          className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="font-semibold text-sm">
                        {isUnassigned ? '-' : formatValue(individualTarget, obj.type)}
                      </span>
                      {!isUnassigned && (
                        <button
                          onClick={() => handleStartEditTarget(objective)}
                          className="ml-2 p-1 text-gray-500 hover:text-[#F58220] hover:bg-gray-100 rounded-md"
                          title="Edit individual target"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Company Target</p>
                  <p className="text-sm font-medium">{formatValue(obj.companyTarget, obj.type)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Progress</p>
                  <p className="text-sm font-medium">{formatValue(currentValue, obj.type)} ({completionPercentage.toFixed(1)}%)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contribution to Company Goal</p>
                  <p className="text-sm font-medium">
                    {obj.companyTarget > 0 
                      ? `${((individualTarget / obj.companyTarget) * 100).toFixed(1)}% of total` 
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {obj.minimumAcceptable && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Minimum Acceptable Value</p>
                  <p className="text-sm font-medium">{formatValue(obj.minimumAcceptable, obj.type)}</p>
                </div>
              )}
            </div>

            <div className="text-xs font-medium text-[#4A453F] mb-2">Monthly Progress</div>
            <MonthlyProgressInputs 
              objective={objective} 
              handleUpdateProgress={handleUpdateProgress} 
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="p-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-[#4A453F]">
          Quantitative Objectives for {salespersonName}
        </h2>
        <button
          onClick={handleToggleCreateModal}
          className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors"
        >
          + Add Objective
        </button>
      </div>
      
      {/* Content */}
      {isLoading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : !orderedObjectives || orderedObjectives.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="space-y-6">
          {orderedObjectives.map((objective, index) => (
            renderObjectiveCard(objective, index)
          ))}
        </div>
      )}
      
      {/* Create modal */}
      {showCreateModal && (
        <QuantitativeObjectiveForm
          onClose={(shouldRefetch) => {
            setShowCreateModal(false);
            if (shouldRefetch) {
              refetch();
            }
          }}
          refetch={refetch}
          salespersonId={salespersonId}
        />
      )}
    </div>
  );
};

export default SalespersonQuantitativeObjectives; 