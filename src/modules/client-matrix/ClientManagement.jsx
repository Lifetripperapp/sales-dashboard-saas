import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useFetchClients from './hooks/useFetchClients';
import useFetchSalespersons from '../../common/hooks/useFetchSalespersons';
import useFetchTechnicians from './hooks/useFetchTechnicians';
import useFetchServices from './hooks/useFetchServices';
import useFetchClientServices from './hooks/useFetchClientServices';
import useSaveClient from './hooks/useSaveClient';
import useSaveClientService from './hooks/useSaveClientService';
import useClientServiceManager from './hooks/useClientServiceManager';
import useUpdateClientServiceNotes from './hooks/useUpdateClientServiceNotes';
import { buildApiUrl } from '../../common/utils/apiConfig';
import { authFetch } from '../../common/utils/fetch-wrapper';

/**
 * ClientManagement component for client management
 * @returns {JSX.Element} The ClientManagement component
 */
const ClientManagement = ({ initialEditClientId }) => {
  // States
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({
    nombre: '',
    vendedorId: '',
    contratoSoporte: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [sort, setSort] = useState({
    sortBy: 'nombre',
    sortDir: 'ASC'
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    vendedorId: '',
    tecnicoId: '',
    email: '',
    telefono: '',
    direccion: '',
    contratoSoporte: false,
    fechaUltimoRelevamiento: '',
    linkDocumentoRelevamiento: '',
    notas: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Service management states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [clientServices, setClientServices] = useState([]);
  const [serviceCountsMap, setServiceCountsMap] = useState({});
  const [expandedClientIds, setExpandedClientIds] = useState(new Set());
  const [expandedServicesMap, setExpandedServicesMap] = useState({});
  const [showServices, setShowServices] = useState(false);
  const [allClientsServices, setAllClientsServices] = useState({});
  const [selectedClientServiceId, setSelectedClientServiceId] = useState(null);
  
  // Fetch clients with filters, pagination, and sorting
  const {
    data: clientsData,
    isLoading,
    error,
    refetch
  } = useFetchClients({
    options: {},
    filters,
    page: pagination.page,
    limit: pagination.limit,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir
  });
  
  // Fetch salespersons for dropdown
  const {
    data: salespersonsData,
    isLoading: isLoadingSalespersons
  } = useFetchSalespersons({
    page: 1,
    limit: 100,
    filters: { estado: 'active' },
    sortBy: 'nombre',
    sortOrder: 'asc'
  });
  
  // Fetch technicians for dropdown
  const {
    data: techniciansData,
    isLoading: isLoadingTechnicians
  } = useFetchTechnicians({
    options: {},
    filters: { estado: 'active' },
    page: 1,
    limit: 100,
    sortBy: 'nombre',
    sortDir: 'ASC'
  });
  
  // Fetch services for dropdown
  const {
    data: servicesData,
    isLoading: isLoadingServices
  } = useFetchServices({
    filters: {},
    options: { estado: 'active' },
    page: 1,
    limit: 100,
    sortBy: 'nombre',
    sortDir: 'ASC'
  });
  
  // Fetch client services when a client is selected
  const {
    data: clientServicesData,
    isLoading: isLoadingClientServices,
    refetch: refetchClientServices
  } = useFetchClientServices(selectedClient?.id, {
    enabled: !!selectedClient?.id
  });
  
  // Client saving mutations
  const { createClient, updateClient, deleteClient } = useSaveClient();
  
  // Client-service mutations
  const { assignService, updateClientService, unassignService } = useSaveClientService();

  // Client-service manager hook for better persistence
  const { toggleServiceAssignment, pendingOperations } = useClientServiceManager();
  
  // Update clients state when data is fetched
  useEffect(() => {
    if (clientsData && clientsData.rows) {
      setClients(clientsData.rows);
      setPagination(prev => ({
        ...prev,
        totalPages: clientsData.totalPages || 1
      }));
      
      // Fetch service counts for each client
      fetchServiceCounts(clientsData.rows).catch(error => {
        console.error("Error fetching service counts:", error);
      });
      
      // Fetch services for clients that are already expanded
      if (expandedClientIds.size > 0) {
        clientsData.rows.forEach(client => {
          if (client && client.id && expandedClientIds.has(client.id)) {
            fetchClientServicesForExpanded(client.id).catch(error => {
              console.error(`Error fetching services for client ${client.id}:`, error);
            });
          }
        });
      }

      // If showing services, fetch all clients' services
      if (showServices) {
        fetchAllClientsServices(clientsData.rows).catch(error => {
          console.error("Error fetching all client services:", error);
        });
      }
    } else if (clientsData === null) {
      // Reset state if data is null
      setClients([]);
      setPagination(prev => ({
        ...prev,
        totalPages: 1
      }));
    }
  }, [clientsData, showServices, expandedClientIds]);
  
  // Fetch service counts for clients
  const fetchServiceCounts = async (clientsList) => {
    if (!clientsList || clientsList.length === 0) {
      console.warn('No clients provided to fetchServiceCounts');
      return;
    }
    
    const countsMap = {};
    
    try {
      // Create a queue of promises to fetch service counts
      const fetchPromises = clientsList.map(async (client) => {
        if (!client || !client.id) {
          console.warn('Invalid client object in fetchServiceCounts');
          return;
        }
        
        try {
          const data = await authFetch(`/api/cliente-servicios/cliente/${client.id}/count`);
          countsMap[client.id] = data.count || 0;
        } catch (error) {
          console.error(`Error fetching service count for client ${client.id}:`, error);
          countsMap[client.id] = 0;
        }
      });
      
      // Wait for all fetches to complete
      await Promise.all(fetchPromises);
      setServiceCountsMap(countsMap);
    } catch (error) {
      console.error('Error in fetchServiceCounts:', error);
      // Ensure we still set a valid object even if there was an error
      setServiceCountsMap(countsMap);
    }
  };

  // Fetch all clients' services for matrix display
  const fetchAllClientsServices = async (clientsList) => {
    if (!clientsList || clientsList.length === 0) {
      console.warn('No clients provided to fetchAllClientsServices');
      return;
    }
    
    const servicesMap = {};
    
    try {
      const fetchPromises = clientsList.map(async (client) => {
        if (!client || !client.id) {
          console.warn('Invalid client object in fetchAllClientsServices');
          return;
        }
        
        try {
          const data = await authFetch(`/api/cliente-servicios/cliente/${client.id}`);
          servicesMap[client.id] = data.data;
        } catch (error) {
          console.error(`Error fetching services for client ${client.id}:`, error);
          servicesMap[client.id] = [];
        }
      });
      
      await Promise.all(fetchPromises);
      setAllClientsServices(servicesMap);
    } catch (error) {
      console.error('Error in fetchAllClientsServices:', error);
      // Ensure we still set a valid object even if there was an error
      setAllClientsServices(servicesMap);
    }
  };
  
  // Update client services when data is fetched
  useEffect(() => {
    if (clientServicesData && Array.isArray(clientServicesData)) {
      setClientServices(clientServicesData);
    } else if (clientServicesData === null) {
      setClientServices([]);
    }
  }, [clientServicesData]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };
  
  // Handle sort changes
  const handleSortChange = (field) => {
    setSort(prev => ({
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === 'ASC' ? 'DESC' : 'ASC'
    }));
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      nombre: '',
      vendedorId: '',
      contratoSoporte: ''
    });
    setShowServices(false);
  };

  // Toggle services display mode
  const handleToggleServicesDisplay = () => {
    setShowServices(prev => !prev);
  };
  
  // Toggle form visibility
  const handleToggleForm = () => {
    setShowForm(prev => !prev);
    if (!showForm) {
      setFormData({
        nombre: '',
        vendedorId: '',
        tecnicoId: '',
        email: '',
        telefono: '',
        direccion: '',
        contratoSoporte: false,
        fechaUltimoRelevamiento: '',
        linkDocumentoRelevamiento: '',
        notas: ''
      });
      setIsEditing(false);
      setFormErrors({});
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear validation error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nombre.trim()) {
      errors.nombre = 'Name is required';
    }
    
    // Email validation is optional now
    if (formData.email && formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email format is invalid';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Create a date object with timezone handling
    const date = new Date(dateString);
    // Format as YYYY-MM-DD for consistent display
    return date.toISOString().split('T')[0];
  };
  
  // Parse date for database submission
  const parseDate = (dateString) => {
    if (!dateString) return null;
    // Create a proper date object from the date string
    return new Date(dateString);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare submission data - normalize fields for the API
    const submissionData = {
      nombre: formData.nombre,
      vendedorId: formData.vendedorId || null,
      tecnicoId: formData.tecnicoId || null,
      email: formData.email || '',
      telefono: formData.telefono || '',
      direccion: formData.direccion || '',
      contratoSoporte: formData.contratoSoporte || false,
      // Use the correct field names to match the database schema and handle dates properly
      fechaUltimoRelevamiento: formData.fechaUltimoRelevamiento ? parseDate(formData.fechaUltimoRelevamiento) : null,
      linkDocumentoRelevamiento: formData.linkDocumentoRelevamiento || '',
      notas: formData.notas || ''
    };
    
    console.log('Submitting client data:', submissionData);
    
    if (isEditing && formData.id) {
      // Update existing client
      updateClient.mutate(
        {
          id: formData.id,
          ...submissionData
        },
        {
          onSuccess: () => {
            setShowForm(false);
            refetch();
          },
          onError: (error) => {
            setFormErrors({ submit: error.message });
          }
        }
      );
    } else {
      // Create new client
      createClient.mutate(
        submissionData,
        {
          onSuccess: () => {
            setShowForm(false);
            refetch();
          },
          onError: (error) => {
            setFormErrors({ submit: error.message });
          }
        }
      );
    }
  };
  
  // Handle edit client
  const handleEditClient = (client) => {
    setFormData({
      id: client.id,
      nombre: client.nombre,
      vendedorId: client.vendedorId,
      tecnicoId: client.tecnicoId || '',
      email: client.email,
      telefono: client.telefono || '',
      direccion: client.direccion || '',
      contratoSoporte: client.contratoSoporte,
      fechaUltimoRelevamiento: client.fechaUltimoRelevamiento ? formatDate(client.fechaUltimoRelevamiento) : '',
      linkDocumentoRelevamiento: client.linkDocumentoRelevamiento || '',
      notas: client.notas || ''
    });
    setIsEditing(true);
    setShowForm(true);
    setFormErrors({});
  };
  
  // Handle delete client
  const handleDeleteClient = (id) => {
    if (window.confirm('¿Está seguro que desea eliminar este cliente?')) {
      deleteClient.mutate(
        id,
        {
          onSuccess: () => {
            refetch();
          },
          onError: (error) => {
            alert(`Error al eliminar cliente: ${error.message}`);
          }
        }
      );
    }
  };
  
  // Handle opening service management modal
  const handleOpenServiceModal = (client) => {
    setSelectedClient(client);
    setSelectedServiceId('');
    setServiceNotes('');
    setSelectedClientServiceId(null);
    setShowServiceModal(true);
    
    // Fetch client services if not already loaded
    if (client.id !== selectedClient?.id) {
      refetchClientServices();
    }
  };
  
  // Handle closing service management modal
  const handleCloseServiceModal = () => {
    setShowServiceModal(false);
    
    // If this client is expanded, refresh its expanded services
    if (selectedClient && expandedClientIds.has(selectedClient.id)) {
      fetchClientServicesForExpanded(selectedClient.id);
    }
    
    setSelectedClient(null);
    setSelectedServiceId('');
    setServiceNotes('');
  };
  
  // Handle service assignment
  const handleAssignService = (e) => {
    e.preventDefault();
    
    if (!selectedServiceId) {
      return;
    }
    
    assignService.mutate(
      {
        clientId: selectedClient.id,
        serviceId: selectedServiceId,
        notas: serviceNotes
      },
      {
        onSuccess: () => {
          refetchClientServices();
          // Update service count for this client
          setServiceCountsMap(prev => ({
            ...prev,
            [selectedClient.id]: (prev[selectedClient.id] || 0) + 1
          }));
          
          // If this client is expanded, also refresh its expanded services
          if (expandedClientIds.has(selectedClient.id)) {
            fetchClientServicesForExpanded(selectedClient.id);
          }
          
          setSelectedServiceId('');
          setServiceNotes('');
        },
        onError: (error) => {
          console.error('Error assigning service:', error.message);
          alert(`Error assigning service: ${error.message}`);
        }
      }
    );
  };
  
  // Handle service unassignment
  const handleUnassignService = (serviceId) => {
    if (window.confirm('Are you sure you want to remove this service?')) {
      unassignService.mutate(
        {
          clientId: selectedClient.id,
          serviceId: serviceId
        },
        {
          onSuccess: () => {
            refetchClientServices();
            // Update service count for this client
            setServiceCountsMap(prev => ({
              ...prev,
              [selectedClient.id]: Math.max(0, (prev[selectedClient.id] || 0) - 1)
            }));
            
            // If this client is expanded, also refresh its expanded services
            if (expandedClientIds.has(selectedClient.id)) {
              fetchClientServicesForExpanded(selectedClient.id);
            }
          },
          onError: (error) => {
            console.error('Error removing service:', error.message);
            alert(`Error removing service: ${error.message}`);
          }
        }
      );
    }
  };
  
  // Toggle expanded view for a client
  const toggleExpandClient = async (clientId) => {
    // Create a new Set from the current expandedClientIds
    const newExpandedIds = new Set(expandedClientIds);
    
    if (newExpandedIds.has(clientId)) {
      // If it's already expanded, collapse it
      newExpandedIds.delete(clientId);
      setExpandedClientIds(newExpandedIds);
    } else {
      // If it's not expanded, expand it and fetch its services
      newExpandedIds.add(clientId);
      setExpandedClientIds(newExpandedIds);
      await fetchClientServicesForExpanded(clientId);
    }
  };
  
  // Quick assign a service directly from the matrix
  const handleQuickAssignService = (client, serviceId) => {
    assignService.mutate(
      {
        clientId: client.id,
        serviceId: serviceId,
        notas: ""
      },
      {
        onSuccess: () => {
          // Update service count for this client
          setServiceCountsMap(prev => ({
            ...prev,
            [client.id]: (prev[client.id] || 0) + 1
          }));
          
          // If this client is expanded, also refresh its expanded services
          if (expandedClientIds.has(client.id)) {
            fetchClientServicesForExpanded(client.id);
          }
        },
        onError: (error) => {
          console.error('Error assigning service:', error.message);
          alert(`Error assigning service: ${error.message}`);
        }
      }
    );
  };
  
  // Fetch services for an expanded client row
  const fetchClientServicesForExpanded = async (clientId) => {
    if (!clientId) {
      console.warn('No client ID provided to fetchClientServicesForExpanded');
      return;
    }
    
    try {
      const data = await authFetch(`/api/cliente-servicios/cliente/${clientId}`);
      setExpandedServicesMap(prev => ({
        ...prev,
        [clientId]: data.data
      }));
    } catch (error) {
      console.error(`Error fetching services for client ${clientId}:`, error);
      setExpandedServicesMap(prev => ({
        ...prev,
        [clientId]: []
      }));
    }
  };
  
  // Handle service toggle for matrix display
  const handleToggleService = async (client, service) => {
    // Check if service is already assigned
    const isAssigned = allClientsServices[client.id]?.some(cs => cs.servicioId === service.id);
    
    try {
      // Optimistically update UI
      setAllClientsServices(prev => {
        const clientServices = [...(prev[client.id] || [])];
        
        if (isAssigned) {
          // Remove service
          const updatedServices = clientServices.filter(cs => cs.servicioId !== service.id);
          return {
            ...prev,
            [client.id]: updatedServices
          };
        } else {
          // Add service
          const newService = {
            id: `temp-${Date.now()}`,
            clientId: client.id,
            servicioId: service.id,
            servicio: service,
            fechaAsignacion: new Date(),
            notas: ''
          };
          return {
            ...prev,
            [client.id]: [...clientServices, newService]
          };
        }
      });
      
      // Update service count
      setServiceCountsMap(prev => ({
        ...prev,
        [client.id]: isAssigned ? Math.max(0, (prev[client.id] || 0) - 1) : (prev[client.id] || 0) + 1
      }));
      
      // Create a compatible client object for the useClientServiceManager hook
      const clientWithServices = {
        ...client,
        servicios: allClientsServices[client.id]?.map(cs => cs.servicio) || []
      };
      
      // Call persistent service toggle
      await toggleServiceAssignment(clientWithServices, service, 
        () => {
          console.log(`[DEBUG] Service toggle successful for ${service.nombre} on client ${client.nombre}`);
          // If this client is expanded, refresh its services
          if (expandedClientIds.has(client.id)) {
            fetchClientServicesForExpanded(client.id);
          }
          // Refresh all services if in matrix mode
          if (showServices) {
            fetchAllClientsServices(clients);
          }
        },
        (error) => {
          console.error(`[DEBUG] Service toggle failed: ${error.message}`);
          alert(`Error toggling service: ${error.message}`);
          // Revert UI by refreshing data
          fetchServiceCounts(clients);
          if (showServices) {
            fetchAllClientsServices(clients);
          }
        }
      );
    } catch (error) {
      console.error(`[DEBUG] Error in service toggle: ${error.message}`);
      alert(`Error toggling service: ${error.message}`);
      // Revert UI by refreshing data
      fetchServiceCounts(clients);
      if (showServices) {
        fetchAllClientsServices(clients);
      }
    }
  };
  
  // Add the new hook
  const { updateNotes } = useUpdateClientServiceNotes();
  
  // Add a new function to handle notes update
  const handleUpdateServiceNotes = (e) => {
    e.preventDefault();
    
    if (!selectedClientServiceId) {
      return;
    }
    
    updateNotes.mutate(
      {
        clientServiceId: selectedClientServiceId,
        notes: serviceNotes
      },
      {
        onSuccess: () => {
          refetchClientServices();
          
          // If this client is expanded, also refresh its expanded services
          if (expandedClientIds.has(selectedClient.id)) {
            fetchClientServicesForExpanded(selectedClient.id);
          }
          
          // Reset form fields
          setSelectedServiceId('');
          setServiceNotes('');
          setSelectedClientServiceId(null);
          
          // Close the modal after successful update
          setShowServiceModal(false);
        },
        onError: (error) => {
          console.error('Error updating service notes:', error.message);
          alert(`Error updating service notes: ${error.message}`);
        }
      }
    );
  };
  
  // Update the useEffect for initialEditClientId to be more robust and handle errors better
  useEffect(() => {
    const fetchAndOpenClientEdit = async () => {
      if (!initialEditClientId) return;
      
      console.log(`Attempting to edit client with ID: ${initialEditClientId}`);
      setShowForm(true); // Open the form immediately to show loading state
      
      try {
        const { data: client } = await authFetch(`/api/clientes/${initialEditClientId}`);
        console.log(`Successfully fetched client data for editing:`, client);
        
        // Set form data and show form for editing
        setFormData({
          id: client.id,
          nombre: client.nombre,
          vendedorId: client.vendedorId,
          tecnicoId: client.tecnicoId || '',
          email: client.email,
          telefono: client.telefono || '',
          direccion: client.direccion || '',
          contratoSoporte: client.contratoSoporte,
          fechaUltimoRelevamiento: client.fechaUltimoRelevamiento ? formatDate(client.fechaUltimoRelevamiento) : '',
          linkDocumentoRelevamiento: client.linkDocumentoRelevamiento || '',
          notas: client.notas || ''
        });
        setIsEditing(true);
        setFormErrors({});
      } catch (error) {
        console.error('Error fetching client for editing:', error);
        alert('Failed to fetch client data for editing: ' + error.message);
        setShowForm(false); // Close the form on error
      }
    };
    
    fetchAndOpenClientEdit();
  }, [initialEditClientId]);
  
  // Render the filters section with additional "Show Services" toggle
  const renderFilters = () => (
    <div className="mb-6 bg-white shadow rounded-lg p-4 border border-neutral-light">
      <h2 className="text-lg font-medium text-neutral-dark mb-4">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-neutral-dark mb-1">
            Client Name
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={filters.nombre}
            onChange={handleFilterChange}
            className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
            placeholder="Search by name"
          />
        </div>
        
        <div>
          <label htmlFor="vendedorId" className="block text-sm font-medium text-neutral-dark mb-1">
            Salesperson
          </label>
          <select
            id="vendedorId"
            name="vendedorId"
            value={filters.vendedorId}
            onChange={handleFilterChange}
            className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
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
        
        <div className="flex items-end">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-[#D3D0CD] text-[#4A453F] rounded hover:bg-[#BDB7B1] focus:outline-none focus:ring-2 focus:ring-[#D3D0CD] focus:ring-opacity-50"
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Services toggle in second row */}
      <div className="mt-4 flex items-center">
        <label htmlFor="showServicesToggle" className="block text-sm font-medium text-neutral-dark mr-3">
          Show Services Matrix
        </label>
        <div 
          onClick={handleToggleServicesDisplay}
          className="relative inline-flex cursor-pointer"
        >
          <div className={`w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${showServices ? 'bg-[#F58220]' : 'bg-gray-200'}`}>
            <div 
              className={`absolute w-5 h-5 transition-transform duration-200 ease-in-out bg-white rounded-full shadow-md transform ${
                showServices ? 'translate-x-6' : 'translate-x-1'
              } top-0.5`}
            ></div>
          </div>
          <span className="sr-only">Toggle services display</span>
        </div>
        <span className="ml-2 text-xs text-gray-500">
          {showServices ? 'Matrix view enabled' : 'List view enabled'}
        </span>
      </div>
    </div>
  );

  // The header row for the clients table needs to be modified to include service columns when showServices is true
  const renderTableHeader = () => (
    <thead className="bg-[#F9F9F9]">
      <tr>
        <th
          className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider cursor-pointer"
          onClick={() => handleSortChange('nombre')}
        >
          <div className="flex items-center">
            <span>Client</span>
            {sort.sortBy === 'nombre' && (
              <span className="ml-1">
                {sort.sortDir === 'ASC' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
          Salesperson
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
          Technician
        </th>
        <th
          className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider cursor-pointer"
          onClick={() => handleSortChange('contratoSoporte')}
        >
          <div className="flex items-center">
            <span>Support Contract</span>
            {sort.sortBy === 'contratoSoporte' && (
              <span className="ml-1">
                {sort.sortDir === 'ASC' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </th>
        {!showServices ? (
          <>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
              Services
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
              Last Assessment
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-neutral-dark uppercase tracking-wider">
              Actions
            </th>
          </>
        ) : (
          <>
            {servicesData?.rows?.map((service) => (
              <th key={service.id} className="px-6 py-3 text-center text-xs font-medium text-neutral-dark uppercase tracking-wider whitespace-normal max-w-xs">
                <div className="overflow-hidden text-ellipsis" title={service.nombre}>
                  {service.nombre}
                </div>
              </th>
            ))}
            <th className="px-6 py-3 text-center text-xs font-medium text-neutral-dark uppercase tracking-wider">
              Actions
            </th>
          </>
        )}
      </tr>
    </thead>
  );

  // Modify renderClient to handle both regular and showServices mode
  const renderClient = (client) => (
    <React.Fragment key={client.id}>
      <tr className="hover:bg-neutral-light">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-neutral-dark">{client.nombre}</div>
          {client.email && (
            <div className="text-xs text-neutral-dark mt-1">{client.email}</div>
          )}
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
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              client.contratoSoporte
                ? 'bg-green-100 text-green-800'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {client.contratoSoporte ? 'Yes' : 'No'}
          </span>
        </td>
        
        {!showServices ? (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleExpandClient(client.id)}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  aria-label={expandedClientIds.has(client.id) ? `Collapse services for ${client.nombre}` : `Expand services for ${client.nombre}`}
                >
                  {expandedClientIds.has(client.id) ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  <span className="font-medium">{serviceCountsMap[client.id] || 0}</span>
                  {expandedClientIds.has(client.id) ? " (Collapse)" : " (Expand)"}
                </button>
                {!expandedClientIds.has(client.id) && serviceCountsMap[client.id] > 0 && (
                  <div className="flex flex-wrap max-w-xs gap-1 ml-2">
                    {(expandedServicesMap[client.id] || []).slice(0, 3).map((clientService) => (
                      <span key={clientService?.id || `temp-${Math.random()}`} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                        {clientService?.servicio?.nombre || 'Unknown service'}
                      </span>
                    ))}
                    {(expandedServicesMap[client.id] || []).length > 3 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                        +{(expandedServicesMap[client.id] || []).length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-dark">
              {client.fechaUltimoRelevamiento ? formatDate(client.fechaUltimoRelevamiento) : '—'}
            </td>
          </>
        ) : (
          servicesData?.rows?.map((service) => {
            const isAssigned = allClientsServices[client.id]?.some(cs => cs.servicioId === service.id);
            const isPending = pendingOperations[`${client.id}-${service.id}`];
            
    return (
              <td key={`${client.id}-${service.id}`} className="px-6 py-4 whitespace-nowrap text-center">
                <input
                  type="checkbox"
                  checked={isAssigned || false}
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
          <button
            onClick={() => handleEditClient(client)}
            className="text-blue-600 hover:text-blue-800 mr-3"
            aria-label={`Edit ${client.nombre}`}
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClient(client.id)}
            className="text-red-600 hover:text-red-800"
            aria-label={`Delete ${client.nombre}`}
          >
            Delete
          </button>
        </td>
      </tr>
      
      {!showServices && expandedClientIds.has(client.id) && (
        <tr className="bg-gray-50">
          <td colSpan="7" className="px-6 py-4">
            <div className="rounded-lg border border-neutral-light bg-white p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-neutral-dark">
                  Services for {client.nombre}
                </h3>
                <button
                  onClick={() => handleOpenServiceModal(client)}
                  className="bg-[#F58220] text-white px-3 py-1 text-sm rounded hover:bg-[#e67812] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F58220]"
                >
                  Manage Services
                </button>
      </div>
              
              {/* Services Matrix */}
              {!expandedServicesMap[client.id] || !servicesData ? (
                <div className="text-center py-4">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent align-[-0.125em]" role="status">
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                      Loading...
                    </span>
                  </div>
                  <p className="mt-2 text-neutral-dark">Loading services...</p>
                </div>
              ) : servicesData.rows.length === 0 ? (
                <p className="text-center py-4 text-neutral-dark">
                  No services available in the system.
                </p>
              ) : (
                <>
                  {/* Service Summary */}
                  <div className="bg-gray-50 p-3 rounded mb-4 flex justify-between items-center">
                    <div className="text-sm">
                      <span className="font-medium">{expandedServicesMap[client.id].length}</span> of <span className="font-medium">{servicesData.rows.length}</span> services assigned
                    </div>
                    <div className="flex space-x-4 text-xs">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>= Assigned</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center mr-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <span>= Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Matrix Table */}
                  <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                    <div className="min-w-max grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {servicesData.rows.map(service => {
                        // Check if this client has this service
                        const hasService = expandedServicesMap[client.id].some(
                          cs => cs.servicioId === service.id
                        );
                        
                        // Find the client service if it exists
                        const clientService = expandedServicesMap[client.id].find(
                          cs => cs.servicioId === service.id
                        );
                        
    return (
                          <div 
                            key={service.id} 
                            className={`p-3 rounded-lg border ${hasService ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} hover:shadow-sm transition-all duration-200`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-sm truncate" title={service.nombre}>
                                {service.nombre}
                              </div>
                              {hasService ? (
        <button
                                  onClick={() => {
                                    setSelectedClient(client);
                                    handleUnassignService(service.id);
                                  }}
                                  className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                                  title="Remove this service"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
        </button>
                              ) : (
                                <button
                                  onClick={() => handleQuickAssignService(client, service.id)}
                                  className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50"
                                  title="Add this service"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              {service.categoria || 'No category'}
                            </div>
                            {clientService?.notas && (
                              <div className="text-xs bg-white p-2 rounded border border-gray-100 mt-1 break-words">
                                {clientService.notas}
                              </div>
                            )}
                            {hasService ? (
                              <button
                                onClick={() => {
                                  setSelectedClient(client);
                                  setSelectedServiceId(service.id);
                                  // Find the clientServiceId for this client-service pair
                                  const clientService = expandedServicesMap[client.id]?.find(cs => 
                                    cs.servicioId === service.id
                                  );
                                  setSelectedClientServiceId(clientService?.id || null);
                                  setServiceNotes(clientService?.notas || '');
                                  setShowServiceModal(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
                                title="Edit notes"
                              >
                                Edit notes
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedClient(client);
                                  setSelectedServiceId(service.id);
                                  setServiceNotes('');
                                  setShowServiceModal(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
                                title="Add with notes"
                              >
                                Add with notes
                              </button>
                            )}
      </div>
    );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );

  // Modified render to use the new components
  // Keep all the existing code, but modify the clients table to use the new renderTableHeader and renderClient methods
  // when rendering the table body:
  return (
    <div>
      {/* Header with title and action buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold text-[#4A453F] mb-4 md:mb-0">Clients</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={handleToggleForm}
            className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Client'}
          </button>
        </div>
      </div>
      
      {/* Client Form */}
      {showForm && (
        <div className="mb-6 bg-white shadow rounded-lg p-4 border border-neutral-light">
          <h2 className="text-lg font-medium text-neutral-dark mb-4">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {formErrors.submit && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                {formErrors.submit}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-neutral-dark mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${
                    formErrors.nombre ? 'border-red-500' : 'border-neutral-light'
                  } p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]`}
                  aria-label="Nombre del cliente"
                  aria-invalid={!!formErrors.nombre}
                  aria-describedby={formErrors.nombre ? 'nombre-error' : undefined}
                />
                {formErrors.nombre && (
                  <p id="nombre-error" className="mt-1 text-sm text-red-500">
                    {formErrors.nombre}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-dark mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${
                    formErrors.email ? 'border-red-500' : 'border-neutral-light'
                  } p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]`}
                  aria-label="Email del cliente"
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? 'email-error' : undefined}
                />
                {formErrors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-500">
                    {formErrors.email}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="vendedorId" className="block text-sm font-medium text-neutral-dark mb-1">
                  Salesperson
                </label>
                <select
                  id="vendedorId"
                  name="vendedorId"
                  value={formData.vendedorId}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${
                    formErrors.vendedorId ? 'border-red-500' : 'border-neutral-light'
                  } p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]`}
                  aria-label="Assigned salesperson"
                  aria-invalid={!!formErrors.vendedorId}
                  aria-describedby={formErrors.vendedorId ? 'vendedorId-error' : undefined}
                >
                  <option value="">Select a salesperson</option>
                  {!isLoadingSalespersons &&
                    salespersonsData?.rows?.map((salesperson) => (
                      <option key={salesperson.id} value={salesperson.id}>
                        {salesperson.nombre}
                      </option>
                    ))}
                </select>
                {formErrors.vendedorId && (
                  <p id="vendedorId-error" className="mt-1 text-sm text-red-500">
                    {formErrors.vendedorId}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="tecnicoId" className="block text-sm font-medium text-neutral-dark mb-1">
                  Technician
                </label>
                <select
                  id="tecnicoId"
                  name="tecnicoId"
                  value={formData.tecnicoId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
                  aria-label="Assigned technician"
                >
                  <option value="">No technician assigned</option>
                  {!isLoadingTechnicians &&
                    techniciansData?.rows?.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.nombre}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-neutral-dark mb-1">
                  Phone
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="text"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
                  aria-label="Client phone number"
                />
              </div>
              
              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-neutral-dark mb-1">
                  Address
                </label>
                <input
                  id="direccion"
                  name="direccion"
                  type="text"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
                  aria-label="Client address"
                />
              </div>
              
              <div>
                <label htmlFor="fechaUltimoRelevamiento" className="block text-sm font-medium text-neutral-dark mb-1">
                  Last Assessment (Optional)
                </label>
                <input
                  id="fechaUltimoRelevamiento"
                  name="fechaUltimoRelevamiento"
                  type="date"
                  value={formData.fechaUltimoRelevamiento || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
                  aria-label="Date of last assessment (optional)"
                />
              </div>
              
              <div>
                <label htmlFor="linkDocumentoRelevamiento" className="block text-sm font-medium text-neutral-dark mb-1">
                  Assessment Document Link (Optional)
                </label>
                <input
                  id="linkDocumentoRelevamiento"
                  name="linkDocumentoRelevamiento"
                  type="text"
                  value={formData.linkDocumentoRelevamiento || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
                  aria-label="Link to assessment document (optional)"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="contratoSoporte"
                  name="contratoSoporte"
                  type="checkbox"
                  checked={formData.contratoSoporte}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#F58220] rounded"
                  aria-label="Client has support contract"
                />
                <label htmlFor="contratoSoporte" className="ml-2 text-sm font-medium text-neutral-dark">
                  Support Contract
                </label>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="notas" className="block text-sm font-medium text-neutral-dark mb-1">
                  Notes
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
                  rows="3"
                  aria-label="Notes about the client"
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleToggleForm}
                className="px-4 py-2 bg-[#D3D0CD] text-[#4A453F] rounded hover:bg-[#BDB7B1] focus:outline-none focus:ring-2 focus:ring-[#D3D0CD] focus:ring-opacity-50"
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
                aria-label={isEditing ? 'Save Changes' : 'Create Client'}
                disabled={createClient.isPending || updateClient.isPending}
              >
                {createClient.isPending || updateClient.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filters - Use the new renderFilters method */}
      {renderFilters()}
      
      {/* Clients Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
      {isLoading ? (
            <div className="p-6 text-center text-neutral-dark">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent align-[-0.125em]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
              <p className="mt-2">Loading clients...</p>
        </div>
      ) : error ? (
            <div className="p-6 text-center text-red-500">
              <p>Error loading clients: {error.message}</p>
          <button
                onClick={() => refetch()}
                className="mt-2 px-4 py-2 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
          >
            Retry
          </button>
        </div>
      ) : clients.length === 0 ? (
            <div className="p-6 text-center text-neutral-dark">
              No clients available with the selected filters.
        </div>
      ) : (
            <table className="min-w-full divide-y divide-neutral-light">
              {renderTableHeader()}
              <tbody className="bg-white divide-y divide-neutral-light">
                {clients.map(client => renderClient(client))}
              </tbody>
            </table>
          )}
          </div>
          
        {/* Pagination - Only show when we have data and not loading */}
        {!isLoading && !error && clientsData && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-neutral-light">
            <div className="flex-1 flex justify-between items-center">
              <p className="text-sm text-neutral-dark">
                {clientsData.count ? (
                  <>
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, clientsData.count)}
                </span>{' '}
                of <span className="font-medium">{clientsData.count}</span> results
                  </>
                ) : (
                  "No results found"
                )}
              </p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-neutral-dark hover:bg-neutral-light border border-neutral-light'
                  }`}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                {pagination.totalPages > 0 && (
                  <span className="px-3 py-1 rounded-md bg-white border border-neutral-light text-neutral-dark">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                )}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className={`px-3 py-1 rounded-md ${
                    pagination.page >= pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-neutral-dark hover:bg-neutral-light border border-neutral-light'
                  }`}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Service Modal */}
      {showServiceModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-neutral-dark">
                  Manage Services for {selectedClient.nombre}
                </h2>
                <button
                  onClick={handleCloseServiceModal}
                  className="text-neutral-dark hover:text-red-500"
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Assigned Services List */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-neutral-dark mb-3">Assigned Services</h3>
                {isLoadingClientServices ? (
                  <p className="text-center py-4 text-neutral-dark">Loading services...</p>
                ) : clientServices && clientServices.length > 0 ? (
                  <div className="border border-neutral-light rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-neutral-light">
                      <thead className="bg-[#F9F9F9]">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Service
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Category
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Notes
                          </th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-dark uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-light">
                        {clientServices.map((clientService) => (
                          <tr key={clientService.id} className="hover:bg-[#F9F9F9]">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                              {clientService.servicio.nombre}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-dark">
                              {clientService.servicio.categoria || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-dark">
                              {clientService.notas || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => handleUnassignService(clientService.servicioId)}
                                className="text-red-600 hover:text-red-800"
                                aria-label={`Remove ${clientService.servicio.nombre}`}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-neutral-dark border border-neutral-light rounded-lg">
                    No services assigned to this client.
                  </p>
                )}
              </div>
              
              {/* Update Service Notes Form */}
              <div className="border-t border-neutral-light pt-6 mt-6">
                <h3 className="text-lg font-medium text-neutral-dark mb-3">
                  {selectedClientServiceId ? 'Update Service Notes' : 'Assign New Service'}
                </h3>
                <form onSubmit={selectedClientServiceId ? handleUpdateServiceNotes : handleAssignService}>
                  {!selectedClientServiceId && (
                    <div className="mb-4">
                      <label htmlFor="serviceId" className="block text-sm font-medium text-neutral-dark mb-1">
                        Select Service
                      </label>
                      <select
                        id="serviceId"
                        name="serviceId"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
                        aria-label="Select a service to assign"
                      >
                        <option value="">-- Select a service --</option>
                        {servicesData?.rows.filter(service => 
                          !clientServices.some(cs => cs.servicioId === service.id)
                        ).map(service => (
                          <option key={service.id} value={service.id}>
                            {service.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="serviceNotes" className="block text-sm font-medium text-neutral-dark mb-1">
                      Notes {selectedClientServiceId ? '' : '(Optional)'}
                    </label>
                    <textarea
                      id="serviceNotes"
                      name="serviceNotes"
                      value={serviceNotes}
                      onChange={(e) => setServiceNotes(e.target.value)}
                      className="w-full rounded-md border border-neutral-light p-2 focus:outline-none focus:ring-1 focus:ring-[#F58220] focus:border-[#F58220]"
                      rows="3"
                      aria-label="Notes about the service"
                      placeholder="Enter any notes about this service assignment"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    {selectedClientServiceId ? (
                      <button
                        type="submit"
                        disabled={updateNotes.isPending}
                        className="px-4 py-2 bg-[#F58220] text-white hover:bg-[#D36D1B] rounded focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
                        aria-label="Update service notes"
                      >
                        {updateNotes.isPending ? 'Updating...' : 'Update Notes'}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!selectedServiceId || assignService.isPending}
                        className={`px-4 py-2 ${
                          !selectedServiceId
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#F58220] text-white hover:bg-[#D36D1B]'
                        } rounded focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50`}
                        aria-label="Assign service"
                      >
                        {assignService.isPending ? 'Assigning...' : 'Assign Service'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement; 