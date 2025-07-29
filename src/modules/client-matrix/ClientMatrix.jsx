import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFetchMatrixData } from './hooks/useFetchClientServices';
import useFetchSalespersons from '../../common/hooks/useFetchSalespersons';
import useFetchTechnicians from './hooks/useFetchTechnicians';
import useSaveClientService from './hooks/useSaveClientService';
import useSaveClient from './hooks/useSaveClient';
import useClientServiceManager from './hooks/useClientServiceManager';
import useClientServiceHealthCheck from './hooks/useClientServiceHealthCheck';
import { useQueryClient } from '@tanstack/react-query';

/**
 * ClientMatrix component displays a consolidated view of clients and their services
 * @returns {JSX.Element} The ClientMatrix component
 */
const ClientMatrix = () => {
  // States
  const [vendedorFilter, setVendedorFilter] = useState('');
  const [tecnicoFilter, setTecnicoFilter] = useState('');
  const [matrixData, setMatrixData] = useState({ clients: [], services: [] });
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showServices, setShowServices] = useState(false); // Toggle for services display
  
  // Get client-service matrix data
  const { data, isLoading, error, refetch } = useFetchMatrixData({
    vendedorId: vendedorFilter || undefined,
    tecnicoId: tecnicoFilter || undefined
  });
  
  // Get salespersons for filtering
  const {
    data: salespersonsData,
    isLoading: isLoadingSalespersons
  } = useFetchSalespersons({}, { estado: 'active' }, 1, 100);
  
  // Get technicians for filtering
  const {
    data: techniciansData,
    isLoading: isLoadingTechnicians
  } = useFetchTechnicians({}, { estado: 'active' }, 1, 100);
  
  // Client-service manager hook
  const { toggleServiceAssignment, pendingOperations } = useClientServiceManager();
  
  // Client delete mutation
  const { deleteClient } = useSaveClient();
  
  // Health check mutation
  const healthCheck = useClientServiceHealthCheck();
  
  // Query client
  const queryClient = useQueryClient();
  
  // Update matrix data when fetched
  useEffect(() => {
    if (data) {
      setMatrixData(data);
    }
  }, [data]);
  
  // Run health check on component mount
  useEffect(() => {
    const runHealthCheck = async () => {
      try {
        console.log('[DEBUG] Running initial health check');
        await healthCheck.mutateAsync();
        // Refetch data after health check
        queryClient.invalidateQueries({ queryKey: ['matrixData'] });
        refetch();
      } catch (error) {
        console.error('[DEBUG] Health check error:', error);
        // Continue loading the component even if health check fails
      }
    };
    
    runHealthCheck();
  }, []);
  
  /**
   * Handle toggling service assignment for a client
   * @param {Object} client - The client object
   * @param {Object} service - The service object
   */
  const handleToggleService = async (client, service) => {
    const isAssigned = client.servicios.some(s => s.id === service.id);
    console.log(`[DEBUG] Main toggle service: ${service.nombre} (${service.id}) for client ${client.nombre} (${client.id}), currently assigned: ${isAssigned}`);
    
    // Update UI optimistically
    const updatedClients = matrixData.clients.map(c => {
      if (c.id === client.id) {
    if (isAssigned) {
          // Remove service
          return {
            ...c,
            servicios: c.servicios.filter(s => s.id !== service.id)
          };
        } else {
          // Add service
          if (!c.servicios.some(s => s.id === service.id)) {
            return {
              ...c,
              servicios: [...c.servicios, service]
            };
          }
        }
      }
      return c;
    });
    
    // Update UI immediately
    setMatrixData(prev => ({
      ...prev,
      clients: updatedClients
    }));
    
    // Perform actual toggle with persistence
    try {
      await toggleServiceAssignment(client, service, 
        () => {
          console.log(`[DEBUG] Service toggle successful for ${service.nombre} on client ${client.nombre}`);
          // Refresh data to ensure UI is in sync with server
          queryClient.invalidateQueries({ queryKey: ['matrixData'] });
          refetch();
        },
        (error) => {
          console.error(`[DEBUG] Service toggle failed: ${error.message}`);
          alert(`Error toggling service: ${error.message}`);
          // Revert UI
          refetch();
        }
      );
    } catch (error) {
      console.error('[DEBUG] Error in service toggle:', error);
      alert(`Error toggling service: ${error.message}`);
      // Revert UI
      refetch();
    }
  };
  
  /**
   * Open the service assignment modal for a client
   * @param {Object} client - The client object
   */
  const openServiceModal = (client) => {
    console.log('[DEBUG] Opening service modal for client:', client.nombre, client.id);
    console.log('[DEBUG] Current client services:', client.servicios.map(s => ({ id: s.id, nombre: s.nombre })));
    
    // Make sure we're working with a fresh copy of the client with all services
    const clientCopy = JSON.parse(JSON.stringify(client)); // Deep copy to avoid reference issues
    setSelectedClient(clientCopy);
    setShowServiceModal(true);
  };
  
  /**
   * Handle client deletion with confirmation
   * @param {string} id - Client ID to delete
   * @param {string} name - Client name for confirmation message
   */
  const handleDeleteClient = (id, name) => {
    if (window.confirm(`Are you sure you want to delete client "${name}"?`)) {
      deleteClient.mutate(id, {
          onSuccess: () => {
            refetch();
          },
          onError: (error) => {
          console.error('Error deleting client:', error.message);
          alert(`Error deleting client: ${error.message}`);
        }
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Create a date object with timezone handling
    const date = new Date(dateString);
    // Format as YYYY-MM-DD for consistent display
    return date.toISOString().split('T')[0];
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setVendedorFilter('');
    setTecnicoFilter('');
    setShowServices(false);
  };

  // Toggle services display
  const handleToggleServicesDisplay = () => {
    setShowServices(prev => !prev);
  };
  
  /**
   * Close the service modal and refresh data if changes were made
   */
  const closeServiceModal = () => {
    console.log('[DEBUG] Closing service modal');
    setShowServiceModal(false);
    setSelectedClient(null);
    
    // Refresh the data when modal is closed to ensure UI is in sync
    console.log('[DEBUG] Forcing data refresh after modal close');
    queryClient.invalidateQueries({ queryKey: ['matrixData'] });
    refetch();
  };
  
  // Loading state showing health check status when applicable
  if (isLoading || healthCheck.isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 border border-neutral-light">
        <p className="text-center text-neutral-dark">
          {healthCheck.isLoading ? 'Running service database health check...' : 'Loading client matrix...'}
        </p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 border border-neutral-light">
        <p className="text-center text-red-500">Error: {error.message}</p>
        <button 
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
          aria-label="Retry"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#4A453F] mb-4 md:mb-0">Client Matrix</h1>
        
        <div className="flex space-x-2">
          <Link 
            to="/client-matrix/clients" 
            className="bg-[#D3D0CD] text-[#4A453F] px-4 py-2 rounded hover:bg-[#BDB7B1] focus:outline-none focus:ring-2 focus:ring-[#D3D0CD] focus:ring-opacity-50"
          >
            Manage Clients
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="mb-6 bg-white shadow rounded-lg p-4 border border-neutral-light">
        <h2 className="text-lg font-medium text-neutral-dark mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="vendedorFilter" className="block text-sm font-medium text-neutral-dark mb-1">
              Salesperson
            </label>
            <select
              id="vendedorFilter"
              value={vendedorFilter}
              onChange={(e) => setVendedorFilter(e.target.value)}
              className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
              aria-label="Filter by salesperson"
            >
              <option value="">All salespersons</option>
              {!isLoadingSalespersons &&
                salespersonsData?.rows?.map((salesperson) => (
                  <option key={salesperson.id} value={salesperson.id}>
                    {salesperson.nombre}
                  </option>
                ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="tecnicoFilter" className="block text-sm font-medium text-neutral-dark mb-1">
              Technician
            </label>
            <select
              id="tecnicoFilter"
              value={tecnicoFilter}
              onChange={(e) => setTecnicoFilter(e.target.value)}
              className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
              aria-label="Filter by technician"
            >
              <option value="">All technicians</option>
              {!isLoadingTechnicians &&
                techniciansData?.rows?.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.nombre}
                  </option>
                ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="flex items-center">
              <label htmlFor="showServicesToggle" className="block text-sm font-medium text-neutral-dark mr-2">
                Show Services
              </label>
              <button 
                onClick={handleToggleServicesDisplay}
                className="relative inline-flex items-center h-6 rounded-full w-12 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F58220]"
                role="switch"
                aria-checked={showServices}
                id="showServicesToggle"
              >
                <span
                  className={`${
                    showServices ? 'bg-[#F58220]' : 'bg-[#D3D0CD]'
                  } block h-6 w-12 rounded-full transition-colors duration-200 ease-in-out`}
                ></span>
                <span
                  className={`${
                    showServices ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
                ></span>
              </button>
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#D3D0CD] text-[#4A453F] rounded hover:bg-[#BDB7B1] focus:outline-none focus:ring-2 focus:ring-[#D3D0CD] focus:ring-opacity-50"
              aria-label="Reset filters"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Client Matrix Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {matrixData.clients?.length === 0 ? (
            <div className="p-6 text-center text-neutral-dark">
              No data available with the selected filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-neutral-light">
              <thead className="bg-[#F9F9F9]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Salesperson
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Technician
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Support Contract
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Last Assessment
                  </th>
                  {!showServices ? (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                      Services
                    </th>
                  ) : (
                    matrixData.services?.map((service) => (
                      <th key={service.id} className="px-6 py-3 text-center text-xs font-medium text-neutral-dark uppercase tracking-wider">
                        {service.nombre}
                      </th>
                    ))
                  )}
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-neutral-dark uppercase tracking-wider">
                    Actions
                  </th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-neutral-light">
                {matrixData.clients.map((client) => (
                  <tr key={client.id} className="hover:bg-neutral-light">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-dark">{client.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-dark">
                        {client.vendedor ? client.vendedor.nombre : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-dark">
                        {client.tecnico ? client.tecnico.nombre : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.contratoSoporte ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {client.contratoSoporte ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.fechaUltimoRelevamiento ? (
                        <div className="flex items-center">
                          <span className="text-sm text-neutral-dark mr-2">
                            {formatDate(client.fechaUltimoRelevamiento)}
                          </span>
                          {client.linkDocumentoRelevamiento && (
                            <a 
                              href={client.linkDocumentoRelevamiento} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-dark">—</span>
                      )}
                    </td>
                    {!showServices ? (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="bg-[#F58220] text-white px-2 rounded font-medium">
                            {client.servicios.length} services
                          </span>
                          <button
                            onClick={() => openServiceModal(client)}
                            className="ml-3 text-blue-600 hover:text-blue-800 text-xs"
                            title="Manage service assignments"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    ) : (
                      matrixData.services?.map((service) => {
                        const isAssigned = client.servicios.some(s => s.id === service.id);
                        const isPending = pendingOperations[`${client.id}-${service.id}`];
                        return (
                          <td key={`${client.id}-${service.id}`} className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => handleToggleService(client, service)}
                              className={`form-checkbox rounded focus:ring-[#F58220] h-5 w-5 ${
                                isPending ? 'opacity-50 cursor-wait' : 'text-[#F58220] cursor-pointer'
                              }`}
                              disabled={isPending}
                              aria-label={`${isAssigned ? 'Remove' : 'Add'} ${service.nombre} service for ${client.nombre}`}
                            />
                          </td>
                        );
                      })
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <Link
                        to={`/client-matrix/clients?edit=${client.id}`}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        aria-label={`Edit ${client.nombre}`}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClient(client.id, client.nombre)}
                        className="text-red-600 hover:text-red-800"
                        aria-label={`Delete ${client.nombre}`}
                      >
                        Delete
                      </button>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>
        </div>
        
      {/* Service Assignment Modal */}
      {showServiceModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-neutral-light flex justify-between items-center">
              <h2 className="text-lg font-medium text-neutral-dark">
                Manage Services for {selectedClient.nombre}
              </h2>
              <button
                onClick={closeServiceModal}
                className="text-neutral-dark hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {matrixData.services?.length > 0 ? (
                <div className="space-y-3">
                  {matrixData.services.map(service => {
                    const isAssigned = selectedClient.servicios.some(s => s.id === service.id);
                    const isPending = pendingOperations[`${selectedClient.id}-${service.id}`];
                    return (
                      <div key={service.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          id={`service-${service.id}`}
                          checked={isAssigned}
                          onChange={() => {
                            console.log('[DEBUG] Modal service toggle:', service.nombre, isAssigned ? 'REMOVE' : 'ADD', 'for client:', selectedClient.nombre, selectedClient.id);
                            // Use the same toggle function for consistency
                            handleToggleService(selectedClient, service);
                          }}
                          className={`form-checkbox rounded focus:ring-[#F58220] h-5 w-5 mr-3 ${
                            isPending ? 'opacity-50 cursor-wait' : 'text-[#F58220] cursor-pointer'
                          }`}
                          disabled={isPending}
                        />
                        <label htmlFor={`service-${service.id}`} className="text-sm text-neutral-dark cursor-pointer flex-grow">
                          {service.nombre}
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-neutral-dark py-4">No services available.</p>
              )}
            </div>
            
            <div className="p-4 border-t border-neutral-light flex justify-end">
              <button
                onClick={closeServiceModal}
                className="px-4 py-2 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientMatrix; 