import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { buildApiUrl } from '../../common/utils/apiConfig';
import { formatDate, formatCurrency, formatPercentage } from '../../common/utils/formatters';
import { authFetch } from '../../common/utils/fetch-wrapper';
import useDeleteQualitativeObjective from '../objectives/hooks/useDeleteQualitativeObjective';
import useFetchSalespersons from '../../common/hooks/useFetchSalespersons';
import useUpdateQualitativeObjectiveStatus from '../objectives/hooks/useUpdateQualitativeObjectiveStatus';
import useSaveQualitativeObjective from '../objectives/hooks/useSaveQualitativeObjective';
import QualitativeManagement from '../objectives/QualitativeManagement';
import SalespersonQuantitativeObjectives from './SalespersonQuantitativeObjectives';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// API Base URL
const API_BASE_URL = 'http://localhost:3000';

/**
 * SalespersonFullDetail component for displaying detailed information about a salesperson
 * @returns {JSX.Element} The SalespersonFullDetail component
 */
const SalespersonFullDetail = () => {
  console.log('Rendering SalespersonFullDetail');
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingObjective, setEditingObjective] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [qualitativeObjectives, setQualitativeObjectives] = useState([]);
  
  // Define handleDeleteSuccess function before it's used in deleteMutation
  // Handle delete success with notification
  const handleDeleteSuccess = (response) => {
    console.log('Salesperson deleted successfully', response);
    
    // Extract data from the response
    const data = response.data || {};
    
    // Show a notification with details about what was removed
    const message = `Salesperson deleted successfully. ${data.unassignedClients > 0 ? `${data.unassignedClients} clients unassigned. ` : ''}${data.removedQuantitativeObjectives > 0 ? `${data.removedQuantitativeObjectives} quantitative objectives removed. ` : ''}${data.removedQualitativeObjectives > 0 ? `${data.removedQualitativeObjectives} qualitative objectives removed.` : ''}`;
    
    // You can implement a toast notification here if you have a notification system
    alert(message);
    
    // Navigate back to salespersons list
    queryClient.invalidateQueries({ queryKey: ['salespersons'] });
    navigate('/salespersons');
  };
  
  // Fetch salesperson details
  const { data: salesperson, isLoading, error, refetch } = useQuery({
    queryKey: ['salesperson', id],
    queryFn: async () => {
      console.log(`Fetching salesperson with ID: ${id}`);
      // Use the full endpoint to get all associated data including clients
      const data = await authFetch(`/api/salespersons/${id}`);
      return data.data;
    },
  });
  
  // Initialize qualitative objectives state from fetched data
  useEffect(() => {
    if (salesperson && salesperson.qualitativeObjectives) {
      // Just copy the objectives without sorting
      setQualitativeObjectives([...salesperson.qualitativeObjectives]);
    }
  }, [salesperson]);
  
  // Delete salesperson mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      console.log(`Deleting salesperson with ID: ${id}`);
      const data = await authFetch(`/api/salespersons/${id}`, {
        method: 'DELETE',
      });
      return data;
    },
    onSuccess: handleDeleteSuccess,
  });
  
  // Get delete objective mutation
  const { deleteObjective } = useDeleteQualitativeObjective();
  
  // Get update status mutation
  const { updateStatus } = useUpdateQualitativeObjectiveStatus();
  
  // Get update objective mutation
  const { updateObjective } = useSaveQualitativeObjective();
  
  // Get salespersons data for the dropdown
  const { data: salespersonsData } = useFetchSalespersons();
  
  // Display translated client data (Spanish field names to English display)
  const displayClientName = (client) => {
    return client.nombre || 'Unnamed Client';
  };
  
  const displayTechnicianName = (client) => {
    return client.tecnico && client.tecnico.nombre ? client.tecnico.nombre : 'N/A';
  };
  
  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId) => {
      console.log(`Deleting client with ID: ${clientId}`);
      const data = await authFetch(`/api/clientes/${clientId}`, {
        method: 'DELETE',
      });
      return data;
    },
    onSuccess: () => {
      // Refresh salesperson data to update client list
      refetch();
      // Also refresh global client list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      alert('Client deleted successfully');
    },
  });
  
  // Handle delete client
  const handleDeleteClient = (clientId, clientName) => {
    if (window.confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
      deleteClientMutation.mutate(clientId);
    }
  };
  
  // Handle delete salesperson
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this salesperson? This will also remove their objective assignments and unassign their clients.')) {
      deleteMutation.mutate();
    }
  };
  
  // Move objective up or down in the list
  const moveObjective = (index, direction) => {
    const newObjectives = [...qualitativeObjectives];
    if (direction === 'up' && index > 0) {
      // Swap with previous item
      [newObjectives[index], newObjectives[index - 1]] = [newObjectives[index - 1], newObjectives[index]];
      setQualitativeObjectives(newObjectives);
    } else if (direction === 'down' && index < newObjectives.length - 1) {
      // Swap with next item
      [newObjectives[index], newObjectives[index + 1]] = [newObjectives[index + 1], newObjectives[index]];
      setQualitativeObjectives(newObjectives);
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
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
  
  // Configure bar chart data for quantitative objectives
  const getQuantitativeChartData = () => {
    if (!salesperson || !salesperson.quantitativeObjectives) return null;
    
    return {
      labels: salesperson.quantitativeObjectives.map((obj) => obj.name),
      datasets: [
        {
          label: 'Current',
          data: salesperson.quantitativeObjectives.map((obj) => obj.ytd),
          backgroundColor: '#F58220',
        },
        {
          label: 'Target',
          data: salesperson.quantitativeObjectives.map((obj) => obj.annual),
          backgroundColor: '#4A453F',
        },
      ],
    };
  };
  
  // Bar chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Quantitative Objectives Progress',
      },
    },
  };
  
  // Handle delete objective
  const handleDeleteObjective = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the objective "${name}"? This action cannot be undone.`)) {
      try {
        await deleteObjective.mutateAsync(id);
        
        // Update local state to reflect deletion while preserving order
        setQualitativeObjectives(prev => prev.filter(obj => obj.id !== id));
      } catch (error) {
        console.error('Failed to delete objective:', error);
      }
    }
  };
  
  // Handle edit objective
  const handleEditObjective = (objective) => {
    setEditingObjective(objective);
    setIsEditModalOpen(true);
  };
  
  // Handle objective status update
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      
      // Update the local state to maintain the current order
      setQualitativeObjectives(prev => 
        prev.map(obj => obj.id === id ? { ...obj, status: newStatus } : obj)
      );
    } catch (error) {
      console.error('Failed to update objective status:', error);
    }
  };
  
  // Handle edit modal close
  const handleEditModalClose = (shouldUpdate = false) => {
    setEditingObjective(null);
    setIsEditModalOpen(false);
    
    if (shouldUpdate) {
      // Fetch updated data but preserve manual ordering
      refetch().then(() => {
        if (salesperson && salesperson.qualitativeObjectives) {
          // Get the current ids in the order they are displayed
          const currentIds = qualitativeObjectives.map(obj => obj.id);
          
          // Create a map of the updated objectives
          const updatedObjectivesMap = new Map(
            salesperson.qualitativeObjectives.map(obj => [obj.id, obj])
          );
          
          // Reconstruct the array maintaining original order,
          // and adding any new objectives at the end
          const updatedOrderedObjectives = [
            // Keep existing objectives in their current order
            ...currentIds
              .filter(id => updatedObjectivesMap.has(id))
              .map(id => updatedObjectivesMap.get(id)),
            
            // Add any new objectives at the end
            ...salesperson.qualitativeObjectives
              .filter(obj => !currentIds.includes(obj.id))
          ];
          
          setQualitativeObjectives(updatedOrderedObjectives);
        }
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent align-[-0.125em]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-[#4A453F]">Loading salesperson details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          <p className="font-medium">Error loading salesperson details</p>
          <p>{error.message}</p>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812]"
            >
              Retry
            </button>
            <Link
              to="/salespersons"
              className="px-4 py-2 bg-[#4A453F] text-white rounded-md hover:bg-[#3a3632]"
            >
              Back to Salespersons
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!salesperson) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 p-4 rounded-md text-yellow-700">
          <p className="font-medium">Salesperson not found</p>
          <Link
            to="/salespersons"
            className="mt-4 inline-block px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812]"
          >
            Back to Salespersons
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#4A453F] mb-4 md:mb-0">{salesperson.nombre}</h1>
        
        <div className="flex space-x-2">
          <Link
            to={`/salespersons/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
          <Link
            to="/salespersons"
            className="px-4 py-2 bg-[#4A453F] text-white rounded-md hover:bg-[#3a3632]"
          >
            Back
          </Link>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-[#D3D0CD]">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-[#F58220] text-[#F58220]'
                  : 'border-transparent text-[#4A453F] hover:border-[#D3D0CD]'
              }`}
              onClick={() => setActiveTab('overview')}
              aria-current={activeTab === 'overview' ? 'page' : undefined}
            >
              Overview
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'clients'
                  ? 'border-[#F58220] text-[#F58220]'
                  : 'border-transparent text-[#4A453F] hover:border-[#D3D0CD]'
              }`}
              onClick={() => setActiveTab('clients')}
              aria-current={activeTab === 'clients' ? 'page' : undefined}
            >
              Clients ({salesperson.clientCount || 0})
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'quantitative'
                  ? 'border-[#F58220] text-[#F58220]'
                  : 'border-transparent text-[#4A453F] hover:border-[#D3D0CD]'
              }`}
              onClick={() => setActiveTab('quantitative')}
              aria-current={activeTab === 'quantitative' ? 'page' : undefined}
            >
              Quantitative Objectives ({salesperson.quantitativeObjectives?.length || 0})
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-3 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'qualitative'
                  ? 'border-[#F58220] text-[#F58220]'
                  : 'border-transparent text-[#4A453F] hover:border-[#D3D0CD]'
              }`}
              onClick={() => setActiveTab('qualitative')}
              aria-current={activeTab === 'qualitative' ? 'page' : undefined}
            >
              Qualitative Objectives ({salesperson.qualitativeObjectives?.length || 0})
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Salesperson Basic Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h2 className="text-lg font-medium text-[#4A453F] mb-4">Personal Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#4A453F] font-medium">Name</p>
                    <p className="text-lg text-[#4A453F]">{salesperson.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#4A453F] font-medium">Email</p>
                    <p className="text-lg text-[#4A453F]">{salesperson.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#4A453F] font-medium">Status</p>
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                        salesperson.estado
                      )}`}
                    >
                      {salesperson.estado === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-[#4A453F] mb-4">Performance Summary</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#4A453F] font-medium">Total Sales</p>
                    <p className="text-lg text-[#F58220] font-bold">
                      {formatCurrency(salesperson.totalSales || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#4A453F] font-medium">Quantitative Progress</p>
                    <div className="flex items-center">
                      <span className="text-lg text-[#F58220] font-bold mr-2">
                        {formatPercentage(salesperson.quantitativeProgress || 0)}
                      </span>
                      <div className="w-32 bg-[#D3D0CD] rounded-full h-2">
                        <div
                          className="bg-[#F58220] h-2 rounded-full"
                          style={{ width: `${(salesperson.quantitativeProgress || 0) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#4A453F] font-medium">Qualitative Progress</p>
                    <div className="flex items-center">
                      <span className="text-lg text-[#F58220] font-bold mr-2">
                        {formatPercentage(salesperson.qualitativeProgress || 0)}
                      </span>
                      <div className="w-32 bg-[#D3D0CD] rounded-full h-2">
                        <div
                          className="bg-[#F58220] h-2 rounded-full"
                          style={{ width: `${(salesperson.qualitativeProgress || 0) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-[#4A453F] mb-4">Client Summary</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#4A453F] font-medium">Total Clients</p>
                    <p className="text-lg text-[#F58220] font-bold">
                      {salesperson.clientCount || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#4A453F] font-medium">Active Service Contracts</p>
                    <p className="text-lg text-[#F58220] font-bold">
                      {salesperson.clients?.filter((client) => client.contratoSoporte).length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#4A453F] font-medium">Total Services</p>
                    <p className="text-lg text-[#F58220] font-bold">
                      {salesperson.serviceCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quantitative Objectives Chart */}
            {salesperson.quantitativeObjectives && salesperson.quantitativeObjectives.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-[#4A453F] mb-4">Quantitative Objectives Progress</h2>
                <div className="h-64">
                  <Bar data={getQuantitativeChartData()} options={barOptions} />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-neutral-dark">Assigned Clients</h2>
              <Link
                to="/client-matrix?tab=clients"
                className="px-3 py-1 bg-[#F58220] text-white rounded hover:bg-[#D36D1B] focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50 text-sm"
              >
                Manage Clients
              </Link>
            </div>
            
            {!salesperson.clients || salesperson.clients.length === 0 ? (
              <p className="text-[#4A453F]">No clients assigned.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#D3D0CD]">
                  <thead className="bg-[#F9F9F9]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Client
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Support Contract
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Last Survey
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Technician
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#D3D0CD]">
                    {salesperson.clients.map((client) => (
                      <tr key={client.id} className="hover:bg-[#F9F9F9]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#4A453F]">{displayClientName(client)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              client.contratoSoporte
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {client.contratoSoporte ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                          {client.fechaUltimoRelevamiento
                            ? formatDate(client.fechaUltimoRelevamiento)
                            : 'Not Surveyed'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                          {displayTechnicianName(client)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Link
                              to={`/client-matrix/clients/${client.id}`}
                              className="text-[#F58220] hover:text-[#e67812]"
                            >
                              View
                            </Link>
                            <Link
                              to={`/client-matrix/clients?edit=${client.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteClient(client.id, displayClientName(client))}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              disabled={deleteClientMutation.isPending && deleteClientMutation.variables === client.id}
                            >
                              {deleteClientMutation.isPending && deleteClientMutation.variables === client.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Quantitative Objectives Tab */}
        {activeTab === 'quantitative' && (
          <SalespersonQuantitativeObjectives 
            salespersonId={id} 
            salespersonName={salesperson.nombre}
          />
        )}
        
        {/* Qualitative Objectives Tab */}
        {activeTab === 'qualitative' && (
          <div className="p-6">
            {!qualitativeObjectives || qualitativeObjectives.length === 0 ? (
              <p className="text-[#4A453F]">No qualitative objectives assigned.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#D3D0CD]">
                  <thead className="bg-[#F9F9F9]">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Order
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Objective
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Due Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Completion Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Weight
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#D3D0CD]">
                    {qualitativeObjectives.map((objective, index) => (
                      <tr key={objective.id} className="hover:bg-[#F9F9F9]">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                          <div className="flex flex-col">
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
                              disabled={index === qualitativeObjectives.length - 1}
                              className={`w-6 h-6 flex items-center justify-center rounded ${
                                index === qualitativeObjectives.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              aria-label="Move down"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-[#4A453F]">{objective.name}</div>
                          {objective.description && (
                            <div className="text-xs text-[#4A453F] mt-1">{objective.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                              objective.status
                            )}`}
                          >
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
                          {objective.dueDate ? formatDate(objective.dueDate) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                          {objective.completionDate ? formatDate(objective.completionDate) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A453F]">
                          {objective.weight}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <select
                              onChange={(e) => handleStatusUpdate(objective.id, e.target.value)}
                              value={objective.status}
                              className="text-sm border border-gray-300 rounded-md py-1 pl-2 pr-7 bg-white focus:outline-none focus:ring-1 focus:ring-[#F58220]"
                            >
                              <option value="pendiente">Pending</option>
                              <option value="en_progreso">In Progress</option>
                              <option value="completado">Completed</option>
                              <option value="no_completado">Not Completed</option>
                            </select>
                            <button
                              onClick={() => handleEditObjective(objective)}
                              className="text-blue-600 hover:text-blue-800"
                              aria-label={`Edit ${objective.name}`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteObjective(objective.id, objective.name)}
                              className="text-red-600 hover:text-red-800"
                              aria-label={`Delete ${objective.name}`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Objective Modal */}
      {isEditModalOpen && (
        <QualitativeManagement
          objective={editingObjective}
          onClose={handleEditModalClose}
          salespersons={salespersonsData?.data || []}
          defaultSalespersonId={id}
        />
      )}
    </div>
  );
};

export default SalespersonFullDetail; 