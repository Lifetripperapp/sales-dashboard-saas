import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../common/utils/apiConfig';
import useFetchQuantitativeObjectives from './hooks/useFetchQuantitativeObjectives';
import useFetchSalespersons from '../../common/hooks/useFetchSalespersons';
import QuantitativeObjectiveForm from './QuantitativeObjectiveForm';
import AssignObjectiveDialog from './AssignObjectiveDialog';
import { formatCurrency, formatPercentage, formatDate } from '../../common/utils/formatters';

/**
 * QuantitativeObjectivesView component for displaying and managing quantitative objectives
 * @returns {JSX.Element} The QuantitativeObjectivesView component
 */
const QuantitativeObjectivesView = () => {
  // State for modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState(null);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // State for filters
  const [filters, setFilters] = useState({
    name: '',
    type: '',
    isGlobal: 'all',
    hasAssignments: 'all'
  });
  
  // Fetch quantitative objectives
  const {
    data: objectives,
    isLoading,
    error,
    refetch
  } = useFetchQuantitativeObjectives(currentPage, pageSize, filters);
  
  // Fetch salespersons for dropdown
  const { data: salespersons } = useFetchSalespersons(1, 100, { estado: 'active' });
  
  // Query client for invalidation
  const queryClient = useQueryClient();
  
  // Delete objective mutation
  const deleteObjective = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(buildApiUrl(`/api/quantitative-objectives/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete objective');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantitativeObjectives'] });
      refetch();
    }
  });
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      name: '',
      type: '',
      isGlobal: 'all',
      hasAssignments: 'all'
    });
    setCurrentPage(1);
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  // Handle create/edit modal
  const handleToggleCreateModal = () => {
    setShowCreateModal(prev => !prev);
    setSelectedObjective(null);
  };
  
  // Handle edit modal
  const handleToggleEditModal = (objective = null) => {
    setSelectedObjective(objective);
    setShowEditModal(prev => !prev);
  };
  
  // Handle assign modal
  const handleToggleAssignModal = (objective = null) => {
    setSelectedObjective(objective);
    setShowAssignModal(prev => !prev);
  };
  
  // Handle delete
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the objective "${name}"? This action cannot be undone.`)) {
      try {
        await deleteObjective.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete objective:', error);
        alert(`Failed to delete objective: ${error.message}`);
      }
    }
  };
  
  // Modal close handler
  const handleModalClose = (shouldRefetch = false) => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowAssignModal(false);
    setSelectedObjective(null);
    if (shouldRefetch) {
      refetch();
    }
  };
  
  // Render filters section
  const renderFilters = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search by name/description */}
        <div>
          <label htmlFor="name-filter" className="block text-sm font-medium text-[#4A453F] mb-2">Search</label>
          <input
            id="name-filter"
            type="text"
            name="name"
            value={filters.name}
            onChange={handleFilterChange}
            placeholder="Search by name/description"
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
          />
        </div>
        
        {/* Filter by type */}
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-[#4A453F] mb-2">Type</label>
          <select
            id="type-filter"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="currency">Currency</option>
            <option value="percentage">Percentage</option>
            <option value="number">Number</option>
          </select>
        </div>
        
        {/* Filter by global status */}
        <div>
          <label htmlFor="global-filter" className="block text-sm font-medium text-[#4A453F] mb-2">Scope</label>
          <select
            id="global-filter"
            name="isGlobal"
            value={filters.isGlobal}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
          >
            <option value="all">All Objectives</option>
            <option value="true">Global Objectives</option>
            <option value="false">Individual Objectives</option>
          </select>
        </div>
        
        {/* Filter by assignment status */}
        <div>
          <label htmlFor="assignment-filter" className="block text-sm font-medium text-[#4A453F] mb-2">Assignment</label>
          <select
            id="assignment-filter"
            name="hasAssignments"
            value={filters.hasAssignments}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
          >
            <option value="all">All Assignments</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-100 text-[#4A453F] rounded-md hover:bg-gray-200 transition-colors text-sm"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
  
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
  
  // Render table with a more structured, column-aligned layout
  const renderTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 py-3 px-4 text-xs font-medium text-[#4A453F]">
        <div className="col-span-3">NAME</div>
        <div className="col-span-1 text-center">TYPE</div>
        <div className="col-span-1 text-center">TARGET</div>
        <div className="col-span-1 text-center">MINIMUM</div>
        <div className="col-span-1 text-center">ASSIGNED</div>
        <div className="col-span-2 text-center">SUM TARGETS</div>
        <div className="col-span-1 text-center">DIFF</div>
        <div className="col-span-2 text-right">ACTIONS</div>
      </div>
      
      {/* Table rows */}
      {objectives?.rows?.map((objective) => (
        <div key={objective.id} className="grid grid-cols-12 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 items-center">
          {/* Name and badges - 3 columns */}
          <div className="col-span-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-[#4A453F]">{objective.name}</h4>
              <div className="flex gap-1">
                {objective.isGlobal && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Global
                  </span>
                )}
              </div>
            </div>
            {objective.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{objective.description}</p>}
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(objective.startDate)} - {formatDate(objective.endDate)}
            </div>
          </div>
          
          {/* Type - 1 column */}
          <div className="col-span-1 text-center">
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              objective.type === 'currency' ? 'bg-green-100 text-green-700' : 
              objective.type === 'percentage' ? 'bg-purple-100 text-purple-700' : 
              'bg-indigo-100 text-indigo-700'
            }`}>
              {objective.type.charAt(0).toUpperCase() + objective.type.slice(1)}
            </span>
          </div>
          
          {/* Target - 1 column */}
          <div className="col-span-1 text-center font-semibold text-sm">
            {formatValue(objective.companyTarget, objective.type)}
          </div>
          
          {/* Minimum - 1 column */}
          <div className="col-span-1 text-center text-sm">
            {objective.minimumAcceptable 
              ? formatValue(objective.minimumAcceptable, objective.type) 
              : '-'}
          </div>
          
          {/* Assigned count - 1 column */}
          <div className="col-span-1 text-center text-sm">
            {objective.assignedCount || 0}
          </div>
          
          {/* Sum targets - 2 columns */}
          <div className="col-span-2 text-center font-semibold text-sm">
            {formatValue(objective.sumIndividualTargets || 0, objective.type)}
          </div>
          
          {/* Difference - 1 column */}
          <div className="col-span-1 text-center">
            <span className={`font-semibold text-sm ${
              objective.difference < 0 
                ? 'text-red-600' 
                : objective.difference > 0 
                  ? 'text-green-600' 
                  : 'text-gray-600'
            }`}>
              {formatValue(objective.difference, objective.type)}
            </span>
          </div>
          
          {/* Actions - 2 columns */}
          <div className="col-span-2 flex space-x-1 justify-end">
            <button
              onClick={() => handleToggleEditModal(objective)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => handleToggleAssignModal(objective)}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
            >
              Assign
            </button>
            <button
              onClick={() => handleDelete(objective.id, objective.name)}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      
      {/* Empty state when no results match filters */}
      {objectives?.rows?.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No objectives match your current filters.
          <button
            onClick={clearFilters}
            className="block mx-auto mt-2 text-sm text-[#F58220] hover:text-[#e67812] underline"
          >
            Clear filters
          </button>
        </div>
      )}
      
      {/* Pagination */}
      {objectives && objectives.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {objectives.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === objectives.totalPages}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white ${
                currentPage === objectives.totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render loading state
  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent"></div>
        <p className="mt-4 text-lg text-[#4A453F]">Loading...</p>
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
        <p className="text-gray-600 mb-4">There are no quantitative objectives matching your filters.</p>
        <button
          onClick={() => handleToggleCreateModal()}
          className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors"
        >
          + Create New Objective
        </button>
      </div>
    </div>
  );
  
  return (
    <div>
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold text-[#4A453F] mb-4 md:mb-0">Quantitative Objectives</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={handleToggleCreateModal}
            className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors"
          >
            + Add Objective
          </button>
        </div>
      </div>
      
      {/* Filters */}
      {renderFilters()}
      
      {/* Content */}
      {isLoading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : objectives?.rows?.length === 0 ? (
        renderEmpty()
      ) : (
        renderTable()
      )}
      
      {/* Modals */}
      {showCreateModal && (
        <QuantitativeObjectiveForm
          onClose={handleModalClose}
          refetch={refetch}
        />
      )}
      
      {showEditModal && selectedObjective && (
        <QuantitativeObjectiveForm
          objective={selectedObjective}
          onClose={handleModalClose}
          refetch={refetch}
        />
      )}
      
      {showAssignModal && selectedObjective && (
        <AssignObjectiveDialog
          objective={selectedObjective}
          salespersons={salespersons?.rows || []}
          onClose={handleModalClose}
          refetch={refetch}
        />
      )}
    </div>
  );
};

export default QuantitativeObjectivesView; 