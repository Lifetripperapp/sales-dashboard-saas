import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../common/utils/apiConfig';
import useFetchServices from './hooks/useFetchServices';
import useSaveClientService from './hooks/useSaveClientService';

/**
 * ClientDetail component for detailed client information
 * @returns {JSX.Element} The ClientDetail component
 */
const ClientDetail = () => {
  // Get client ID from URL
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State for client data
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceNotes, setServiceNotes] = useState({});
  const [showNotesForm, setShowNotesForm] = useState(null);
  
  // Fetch all services for dropdown
  const {
    data: servicesData,
    isLoading: isLoadingServices
  } = useFetchServices({}, { estado: 'active' }, 1, 100);
  
  // Client-service mutations
  const { assignService, unassignService } = useSaveClientService();
  
  // Fetch client details
  useEffect(() => {
    const fetchClientDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(buildApiUrl(`/api/clientes/${id}`));
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error fetching client details');
        }
        
        const data = await response.json();
        setClient(data.data);
      } catch (err) {
        console.error('Error fetching client details:', err.message);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchClientDetails();
    }
  }, [id]);
  
  // Handle service assignment
  const handleAssignService = (serviceId) => {
    assignService.mutate(
      {
        clientId: id,
        serviceId: serviceId
      },
      {
        onSuccess: () => {
          refreshClientData();
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
          clientId: id,
          serviceId
        },
        {
          onSuccess: () => {
            refreshClientData();
          },
          onError: (error) => {
            console.error('Error unassigning service:', error.message);
            alert(`Error removing service: ${error.message}`);
          }
        }
      );
    }
  };
  
  // Refresh client data
  const refreshClientData = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/clientes/${id}`));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error refreshing client details');
      }
      
      const data = await response.json();
      setClient(data.data);
    } catch (err) {
      console.error('Error refreshing client details:', err.message);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get service category display name
  const getServiceCategoryLabel = (category) => {
    const categories = {
      infraestructura: 'Infraestructura',
      soporte: 'Soporte',
      software: 'Software',
      hardware: 'Hardware',
      devops: 'DevOps',
      consultoria: 'Consultoría',
      seguridad: 'Seguridad'
    };
    
    return categories[category?.toLowerCase()] || category;
  };
  
  // Handle notes change
  const handleNotesChange = (e) => {
    setServiceNotes({
      ...serviceNotes,
      [showNotesForm]: e.target.value
    });
  };
  
  // Save service notes
  const saveServiceNotes = (serviceId) => {
    // Here you would call an API to save the notes
    console.log('Saving notes for service', serviceId, serviceNotes[serviceId]);
    setShowNotesForm(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 border border-neutral-light">
        <p className="text-center text-neutral-dark">Loading client information...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 border border-neutral-light">
        <p className="text-center text-red-500">Error: {error}</p>
        <div className="flex justify-center mt-4">
          <button
            onClick={() => navigate('/client-matrix/clients')}
            className="px-4 py-2 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
            aria-label="Back to clients list"
          >
            Back to clients list
          </button>
        </div>
      </div>
    );
  }
  
  // No client found
  if (!client) {
    return (
      <div className="bg-white shadow rounded-lg p-6 border border-neutral-light">
        <p className="text-center text-neutral-dark">Client not found.</p>
        <div className="flex justify-center mt-4">
          <button
            onClick={() => navigate('/client-matrix/clients')}
            className="px-4 py-2 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
            aria-label="Back to clients list"
          >
            Back to clients list
          </button>
        </div>
      </div>
    );
  }
  
  // Get assigned services and available services
  const assignedServices = client.servicios || [];
  const availableServices = servicesData?.rows?.filter(service => 
    !assignedServices.some(clientService => clientService.id === service.id)
  ) || [];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-neutral-dark">Client Details</h1>
        <div className="flex space-x-2">
          <Link
            to="/client-matrix/clients"
            className="px-4 py-2 bg-[#D3D0CD] text-[#4A453F] rounded hover:bg-[#BDB7B1] focus:outline-none focus:ring-2 focus:ring-[#D3D0CD] focus:ring-opacity-50"
            aria-label="Back to clients list"
          >
            Back
          </Link>
          <Link
            to={`/client-matrix/clients?edit=${client.id}`}
            className="px-4 py-2 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
            aria-label="Edit client"
          >
            Edit
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6 border border-neutral-light">
          <h2 className="text-xl font-medium text-neutral-dark mb-4">Client Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-neutral-dark">Name</h3>
              <p className="text-lg">{client.nombre}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neutral-dark">Email</h3>
              <p className="text-lg">{client.email}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neutral-dark">Phone</h3>
              <p className="text-lg">{client.telefono || '-'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neutral-dark">Address</h3>
              <p className="text-lg">{client.direccion || '-'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neutral-dark">Support Contract</h3>
              <p className="text-lg">
                {client.contratoSoporte ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Not active
                  </span>
                )}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-neutral-dark">Last Survey</h3>
              <p className="text-lg">{formatDate(client.ultimoRelevamiento)}</p>
            </div>
          </div>
          
          {/* Assigned People */}
          <h2 className="text-xl font-medium text-neutral-dark mt-8 mb-4">Assigned Staff</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 border border-neutral-light rounded-lg">
              <h3 className="text-lg font-medium text-neutral-dark mb-2">Salesperson</h3>
              {client.vendedor ? (
                <div>
                  <p className="font-medium">{client.vendedor.nombre}</p>
                  <p className="text-sm">{client.vendedor.email}</p>
                  <p className="text-sm">{client.vendedor.telefono || '-'}</p>
                </div>
              ) : (
                <p className="text-neutral-dark">Not assigned</p>
              )}
            </div>
            
            <div className="p-4 border border-neutral-light rounded-lg">
              <h3 className="text-lg font-medium text-neutral-dark mb-2">Technician</h3>
              {client.tecnico && <p className="font-medium">{client.tecnico.nombre}</p>}
            </div>
          </div>
          
          {/* Services Section */}
          <div className="bg-white border border-neutral-light rounded-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-neutral-dark">
                Services for {client.nombre}
              </h2>
              <button
                onClick={() => navigate(`/client-matrix/clients?edit=${client.id}`)}
                className="px-4 py-2 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
              >
                Manage Services
              </button>
            </div>
            
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-neutral-dark">
                {assignedServices.length} of {assignedServices.length + availableServices.length} services assigned
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <span className="text-green-500 mr-1">✓</span>
                  <span>= Assigned</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-1">+</span>
                  <span>= Available</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Assigned Services */}
              {assignedServices.map(service => (
                <div key={service.id} className="bg-green-50 border border-neutral-light rounded-lg p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{service.nombre}</h3>
                    <button
                      onClick={() => handleUnassignService(service.id)}
                      className="text-red-500 hover:text-red-700"
                      aria-label={`Remove ${service.nombre}`}
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-sm text-neutral-dark mb-2">{getServiceCategoryLabel(service.categoria)}</p>
                  
                  {showNotesForm === service.id ? (
                    <div className="mt-auto">
                      <textarea
                        className="w-full p-2 border border-neutral-light rounded text-sm"
                        rows="3"
                        value={serviceNotes[service.id] || service.notas || ''}
                        onChange={handleNotesChange}
                        placeholder="Add notes about this service..."
                      ></textarea>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => saveServiceNotes(service.id)}
                          className="px-2 py-1 bg-[#F58220] text-white rounded text-xs"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm mb-2">
                        {service.ClientService?.notas || 'No notes added'}
                      </p>
                      <button
                        onClick={() => {
                          setServiceNotes({
                            ...serviceNotes,
                            [service.id]: service.ClientService?.notas || ''
                          });
                          setShowNotesForm(service.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm mt-auto"
                      >
                        Edit notes
                      </button>
                    </>
                  )}
                </div>
              ))}
              
              {/* Available Services */}
              {availableServices.map(service => (
                <div key={service.id} className="bg-white border border-neutral-light rounded-lg p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{service.nombre}</h3>
                    <button
                      onClick={() => handleAssignService(service.id)}
                      className="text-green-500 hover:text-green-700"
                      aria-label={`Add ${service.nombre}`}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-neutral-dark mb-2">{getServiceCategoryLabel(service.categoria)}</p>
                  <button
                    onClick={() => {
                      setServiceNotes({
                        ...serviceNotes,
                        [service.id]: ''
                      });
                      setShowNotesForm(service.id);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-auto"
                    disabled
                  >
                    Add with notes
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Notes */}
          {client.notas && (
            <div className="mt-8">
              <h2 className="text-xl font-medium text-neutral-dark mb-4">Notes</h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="whitespace-pre-line">{client.notas}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          {/* Add any additional sidebar content here if needed */}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail; 