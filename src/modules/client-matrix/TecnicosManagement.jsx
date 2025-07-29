import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useFetchTechnicians from './hooks/useFetchTechnicians';
import useSaveTechnician from './hooks/useSaveTechnician';
import { PencilIcon as EditIcon, TrashIcon as DeleteIcon } from '@heroicons/react/24/outline';

/**
 * TecnicosManagement component for technician management
 * @returns {JSX.Element} The TecnicosManagement component
 */
const TecnicosManagement = () => {
  // States
  const [technicians, setTechnicians] = useState([]);
  const [filters, setFilters] = useState({
    nombre: '',
    especialidad: '',
    estado: ''
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
    email: '',
    telefono: '',
    especialidad: '',
    notas: '',
    estado: 'active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch technicians with filters, pagination, and sorting
  const {
    data: techniciansData,
    isLoading,
    error,
    refetch
  } = useFetchTechnicians({
    options: {},
    filters: {
      nombre: filters.nombre,
      especialidad: filters.especialidad,
      estado: filters.estado
    },
    page: pagination.page,
    limit: pagination.limit,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir
  });
  
  // Technician saving mutations
  const { createTechnician, updateTechnician, deleteTechnician } = useSaveTechnician();
  
  // Update technicians state when data is fetched
  useEffect(() => {
    if (techniciansData) {
      setTechnicians(techniciansData.rows);
      setPagination(prev => ({
        ...prev,
        totalPages: techniciansData.totalPages
      }));
    }
  }, [techniciansData]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };
  
  // Handle sort changes
  const handleSort = (field) => {
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
      especialidad: '',
      estado: ''
    });
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };
  
  // Toggle form visibility
  const handleToggleForm = () => {
    setShowForm(prev => !prev);
    if (!showForm) {
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        especialidad: '',
        notas: '',
        estado: 'active'
      });
      setIsEditing(false);
      setFormErrors({});
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      errors.nombre = 'Nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email no es válido';
    }
    
    // Only name and email are required, all other fields are optional
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Create data object matching our technician model fields
    const technicianData = {
      id: formData.id,
      nombre: formData.nombre.trim(),
      email: formData.email.trim(),
      telefono: formData.telefono || '',  // Empty string is allowed
      especialidad: formData.especialidad || '', 
      notas: formData.notas || '',  // Empty string is allowed
      estado: formData.estado
    };
    
    if (isEditing) {
      // Update existing technician
      updateTechnician.mutate(
        technicianData,
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
      // Create new technician
      createTechnician.mutate(
        technicianData,
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
  
  // Handle edit technician
  const handleEditTechnician = (technician) => {
    // Map from technician model fields to our form
    setFormData({
      id: technician.id,
      nombre: technician.nombre,
      email: technician.email,
      telefono: technician.telefono || '',
      especialidad: technician.especialidad || '', 
      notas: technician.notas || '',
      estado: technician.estado
    });
    setIsEditing(true);
    setShowForm(true);
    setFormErrors({});
  };
  
  // Handle delete technician
  const handleDeleteTechnician = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este técnico?')) {
      console.log(`Intentando eliminar técnico con ID: ${id}`);
      
      deleteTechnician.mutate(
        { id }, // Pass as object to support the force parameter
        {
          onSuccess: () => {
            console.log(`Técnico eliminado exitosamente con ID: ${id}`);
            refetch();
          },
          onError: (error) => {
            console.error(`Error al eliminar técnico: ${error.message}`, error);
            
            // If the error has canForceDelete property, it means there are assigned clients
            if (error.canForceDelete) {
              console.log(`El técnico tiene ${error.clientCount} clientes asignados.`);
              
              // Ask the user if they want to proceed with force deletion
              if (window.confirm(`Este técnico tiene ${error.clientCount} clientes asignados. ¿Quieres eliminar el técnico de todos modos y desasignar estos clientes?`)) {
                deleteTechnician.mutate(
                  { id, force: true },
                  {
                    onSuccess: () => {
                      console.log(`Técnico forzado eliminado exitosamente con ID: ${id}`);
                      alert(`Técnico eliminado exitosamente. ${error.clientCount} clientes fueron desasignados.`);
                      refetch();
                    },
                    onError: (forcedError) => {
                      console.error(`Error al forzar la eliminación del técnico: ${forcedError.message}`, forcedError);
                      alert(`Error al eliminar técnico: ${forcedError.message}`);
                    }
                  }
                );
              }
            } else {
              // Regular error, just show an alert
              alert(`Error al eliminar técnico: ${error.message}`);
            }
          }
        }
      );
    }
  };
  
  // Helper to render sort icon
  const renderSortIcon = () => (
    <span className="ml-1 text-[#F58220]">
      {sort.sortDir === 'ASC' ? ' ▲' : ' ▼'}
    </span>
  );
  
  // Render loading state
  if (isLoading && !techniciansData) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent align-[-0.125em]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-4 text-lg text-[#4A453F]">Loading technicians...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-sm text-red-700">
          <h2 className="text-xl font-semibold mb-2">Error loading technicians</h2>
          <p className="mb-4">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header with title and action button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold text-[#4A453F] mb-4 md:mb-0">Technicians</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={handleToggleForm}
            className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Technician'}
          </button>
        </div>
      </div>
      
      {/* Technician Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-medium text-[#4A453F] mb-4">
            {isEditing ? 'Edit Technician' : 'New Technician'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {formErrors.submit && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                {formErrors.submit}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.nombre ? 'border-red-500' : 'border-gray-200'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                />
                {formErrors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${
                    formErrors.email ? 'border-red-500' : 'border-gray-200'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="text"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="especialidad" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Especialidad
                </label>
                <input
                  id="especialidad"
                  name="especialidad"
                  type="text"
                  value={formData.especialidad}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="notas" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Notas
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Estado
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent appearance-none bg-white"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleToggleForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50"
                disabled={updateTechnician.isLoading || createTechnician.isLoading}
              >
                {updateTechnician.isLoading || createTechnician.isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : isEditing ? 'Update Technician' : 'Create Technician'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-[#4A453F] mb-1">
              Nombre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={filters.nombre}
                onChange={handleFilterChange}
                placeholder="Search by name..."
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="especialidad" className="block text-sm font-medium text-[#4A453F] mb-1">
              Especialidad
            </label>
            <input
              id="especialidad"
              name="especialidad"
              type="text"
              value={filters.especialidad}
              onChange={handleFilterChange}
              placeholder="Filter by position..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-[#4A453F] mb-1">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              value={filters.estado}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent appearance-none bg-white"
            >
              <option value="">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Technicians Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {technicians.length === 0 ? (
          <div className="p-8 text-center text-[#4A453F]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-medium">No technicians found</p>
            <p className="text-gray-500 mt-1">Try adjusting your filters or add a new technician.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" aria-label="Technicians table">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('nombre')}
                  >
                    Nombre {sort.sortBy === 'nombre' && renderSortIcon()}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('especialidad')}
                  >
                    Especialidad {sort.sortBy === 'especialidad' && renderSortIcon()}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!isLoading && !techniciansData?.rows?.length && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No se encontraron técnicos
                    </td>
                  </tr>
                )}
                
                {isLoading && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#F58220]"></div>
                        <span className="text-gray-500">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {!isLoading && techniciansData?.rows?.map((technician) => (
                  <tr 
                    key={technician.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/client-matrix/technicians/${technician.id}`}
                        className="text-[#4A453F] hover:text-[#F58220] font-medium hover:underline"
                      >
                        {technician.nombre}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{technician.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{technician.telefono || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{technician.especialidad || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        technician.estado === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {technician.estado === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEditTechnician(technician)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTechnician(technician.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <DeleteIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {technicians.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, techniciansData?.count || 0)}
            </span>{' '}
            of <span className="font-medium">{techniciansData?.count || 0}</span> technicians
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-3 py-1 rounded-md ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-[#4A453F] border border-gray-200 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50`}
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="px-3 py-1 rounded-md bg-white border border-gray-200 text-[#4A453F]">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className={`px-3 py-1 rounded-md ${
                pagination.page >= pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-[#4A453F] border border-gray-200 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:ring-opacity-50`}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TecnicosManagement; 