import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetchQualitativeObjectives from './hooks/useFetchQualitativeObjectives';
import useUpdateQualitativeObjectiveStatus from './hooks/useUpdateQualitativeObjectiveStatus';
import useDeleteQualitativeObjective from './hooks/useDeleteQualitativeObjective';
import QualitativeManagement from './QualitativeManagement';
import useFetchSalespersons from '../../common/hooks/useFetchSalespersons';
import { formatDate } from '../../common/utils/formatters';

/**
 * ObjectivesView component for displaying and managing qualitative objectives
 * @returns {JSX.Element} The ObjectivesView component
 */
const ObjectivesView = () => {
  console.log('Rendering ObjectivesView');
  
  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState(null);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // State for filters
  const [filters, setFilters] = useState({
    name: '',
    salespersonId: '',
    status: '',
    isGlobal: 'all' // 'all', 'true', or 'false'
  });
  
  // Fetch qualitative objectives
  const {
    data: objectives,
    isLoading,
    error,
    refetch
  } = useFetchQualitativeObjectives(currentPage, pageSize, filters);
  
  // Fetch salespersons for dropdown
  const { data: salespersons } = useFetchSalespersons(1, 100, { estado: 'active' });
  
  // Get status update mutation
  const { updateStatus } = useUpdateQualitativeObjectiveStatus();
  
  // Get delete mutation
  const { deleteObjective } = useDeleteQualitativeObjective();
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      name: '',
      salespersonId: '',
      status: '',
      isGlobal: 'all'
    });
    setCurrentPage(1);
  };
  
  // Toggle modal for create/edit
  const handleToggleModal = (objective = null) => {
    setSelectedObjective(objective);
    setShowModal(prev => !prev);
  };
  
  // Handle modal close
  const handleModalClose = (shouldRefetch = false) => {
    setShowModal(false);
    setSelectedObjective(null);
    if (shouldRefetch) {
      refetch();
    }
  };
  
  // Handle status change
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };
  
  // Handle delete
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the objective "${name}"? This action cannot be undone.`)) {
      try {
        await deleteObjective.mutateAsync(id);
        refetch();
      } catch (error) {
        console.error('Failed to delete objective:', error);
      }
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'no_completado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Render filters section
  const renderFilters = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search by name */}
        <div>
          <label htmlFor="name-filter" className="block text-sm font-medium text-[#4A453F] mb-2">Search</label>
          <input
            id="name-filter"
            type="text"
            name="name"
            value={filters.name}
            onChange={handleFilterChange}
            placeholder="Search by name"
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
            aria-label="Filter by name"
          />
        </div>
        
        {/* Filter by salesperson */}
        <div>
          <label htmlFor="salesperson-filter" className="block text-sm font-medium text-[#4A453F] mb-2">Salesperson</label>
          <select
            id="salesperson-filter"
            name="salespersonId"
            value={filters.salespersonId}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
            aria-label="Filter by salesperson"
          >
            <option value="">All Salespersons</option>
            {salespersons?.rows?.map((salesperson) => (
              <option key={salesperson.id} value={salesperson.id}>
                {salesperson.nombre}
              </option>
            ))}
          </select>
        </div>
        
        {/* Filter by status */}
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-[#4A453F] mb-2">Status</label>
          <select
            id="status-filter"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="pendiente">Pending</option>
            <option value="en_progreso">In Progress</option>
            <option value="completado">Completed</option>
            <option value="no_completado">Not Completed</option>
          </select>
        </div>
        
        {/* Filter by global/individual */}
        <div>
          <label htmlFor="global-filter" className="block text-sm font-medium text-[#4A453F] mb-2">Type</label>
          <select
            id="global-filter"
            name="isGlobal"
            value={filters.isGlobal}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            <option value="true">Global Objectives</option>
            <option value="false">Individual Objectives</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-100 text-[#4A453F] rounded-md hover:bg-gray-200 transition-colors text-sm"
          aria-label="Clear all filters"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
  
  // Render table
  const renderTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">Objective</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">Assigned To</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">Due Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">Weight</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#4A453F] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {objectives?.rows?.map((objective) => (
            <tr key={objective.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-[#4A453F]">{objective.name}</div>
                {objective.description && (
                  <div className="text-xs text-[#4A453F] mt-1">{objective.description}</div>
                )}
                {objective.isGlobal && (
                  <div className="text-xs text-blue-600 mt-1">(Global objective)</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(objective.status)}`}>
                  {objective.status === 'pendiente'
                    ? 'Pending'
                    : objective.status === 'en_progreso'
                    ? 'In Progress'
                    : objective.status === 'completado'
                    ? 'Completed'
                    : 'Not Completed'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                {objective.isGlobal
                  ? 'All Salespersons'
                  : objective.assignedSalespersons?.length > 0
                    ? objective.assignedSalespersons.map(sp => sp.nombre).join(', ')
                    : 'Not Assigned'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                {objective.dueDate ? formatDate(objective.dueDate) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                {objective.weight}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleToggleModal(objective)}
                  className="text-[#F58220] hover:text-[#e67812] mr-3"
                  aria-label={`Edit ${objective.name}`}
                >
                  Edit
                </button>
                <select
                  value={objective.status}
                  onChange={(e) => handleStatusChange(objective.id, e.target.value)}
                  className="text-sm border border-gray-200 rounded px-2 py-1 mr-3"
                  aria-label={`Update status for ${objective.name}`}
                >
                  <option value="pendiente">Pending</option>
                  <option value="en_progreso">In Progress</option>
                  <option value="completado">Completed</option>
                  <option value="no_completado">Not Completed</option>
                </select>
                <button
                  onClick={() => handleDelete(objective.id, objective.name)}
                  className="text-red-600 hover:text-red-800"
                  aria-label={`Delete ${objective.name}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
  return (
    <div>
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold text-[#4A453F] mb-4 md:mb-0">Qualitative Objectives</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleToggleModal()}
            className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors"
          >
            + Add Objective
          </button>
        </div>
      </div>
      
      {/* Filters section */}
      {renderFilters()}
      
      {/* Results section */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent align-[-0.125em]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2 text-[#4A453F]">Loading objectives...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          <p className="font-medium">Error loading objectives</p>
          <p>{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812]"
          >
            Retry
          </button>
        </div>
      ) : !objectives?.rows?.length ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="text-center py-8">
            <p className="text-xl font-medium text-[#4A453F]">No qualitative objectives found</p>
            <p className="text-[#4A453F] mt-2">Try clearing filters or create a new objective</p>
            <button
              onClick={() => handleToggleModal()}
              className="mt-4 px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812]"
            >
              + Add Objective
            </button>
          </div>
        </div>
      ) : (
        <div>
          {renderTable()}
          
          {/* Pagination */}
          {objectives?.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-[#4A453F]">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, objectives.count)} of {objectives.count} objectives
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-[#4A453F] hover:bg-gray-200'
                  }`}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === objectives.totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === objectives.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-[#4A453F] hover:bg-gray-200'
                  }`}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Create/Edit Modal */}
      {showModal && (
        <QualitativeManagement
          objective={selectedObjective}
          onClose={handleModalClose}
          salespersons={salespersons?.rows || []}
        />
      )}
    </div>
  );
};

export default ObjectivesView; 