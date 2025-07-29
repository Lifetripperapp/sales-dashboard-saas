import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useFetchServices from './hooks/useFetchServices';
import useSaveService from './hooks/useSaveService';

/**
 * ServiciosManagement component provides an interface for managing services
 * @returns {JSX.Element} The ServiciosManagement component
 */
const ServiciosManagement = () => {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('nombre');
  const [sortDir, setSortDir] = useState('ASC');
  const [selectedService, setSelectedService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch services with filters and pagination
  const {
    data: servicesData,
    isLoading,
    error,
    refetch
  } = useFetchServices(
    { nombre: searchTerm, categoria: categoryFilter },
    { estado: 'active' },
    page,
    limit,
    sortBy,
    sortDir
  );

  // Force refetch when filters change
  useEffect(() => {
    refetch();
    console.log('Refetching with filters - Category:', categoryFilter, 'Search:', searchTerm);
  }, [categoryFilter, searchTerm, refetch]);

  // Mutations for creating, updating, and deleting services
  const { createService, updateService, deleteService } = useSaveService();

  // Handle search input change
  const handleSearchChange = (e) => {
    console.log('Search changed to:', e.target.value);
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  // Handle category filter change
  const handleCategoryChange = (e) => {
    console.log('Category changed to:', e.target.value);
    setCategoryFilter(e.target.value);
    setPage(1); // Reset to first page on new filter
  };

  // Handle page change for pagination
  const handlePageChange = (newPage) => {
    // Ensure page is within valid range
    if (newPage >= 1 && newPage <= (servicesData?.totalPages || 1)) {
      console.log('Changing to page:', newPage);
      setPage(newPage);
    }
  };

  // Handle sorting change
  const handleSortChange = (column) => {
    if (sortBy === column) {
      // If already sorting by this column, toggle direction
      setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Otherwise, sort by new column in ascending order
      setSortBy(column);
      setSortDir('ASC');
    }
    setPage(1); // Reset to first page on new sort
  };

  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortBy !== field) return null;
    return sortDir === 'ASC' ? ' ▲' : ' ▼';
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setServiceForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when value changes
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Open modal for creating a new service
  const handleAddService = () => {
    setSelectedService(null);
    setServiceForm({
      nombre: '',
      descripcion: '',
      categoria: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for editing an existing service
  const handleEditService = (service) => {
    setSelectedService(service);
    setServiceForm({
      nombre: service.nombre,
      descripcion: service.descripcion || '',
      categoria: service.categoria || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate form before submitting
  const validateForm = () => {
    const errors = {};

    if (!serviceForm.nombre.trim()) {
      errors.nombre = 'Name is required';
    }

    if (!serviceForm.categoria.trim()) {
      errors.categoria = 'Category is required';
    }

    // No validation for descripcion since it's optional

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (selectedService) {
        // Update existing service
        await updateService.mutateAsync(
          { id: selectedService.id, ...serviceForm },
          {
            onSuccess: () => {
              console.log(`Service ${serviceForm.nombre} updated successfully`);
              setIsModalOpen(false);
              refetch();
            },
            onError: (error) => {
              console.error('Error updating service:', error.message);
              setFormErrors(prev => ({
                ...prev,
                submit: error.message
              }));
            }
          }
        );
      } else {
        // Create new service
        await createService.mutateAsync(
          serviceForm,
          {
            onSuccess: () => {
              console.log(`Service ${serviceForm.nombre} created successfully`);
              setIsModalOpen(false);
              refetch();
            },
            onError: (error) => {
              console.error('Error creating service:', error.message);
              setFormErrors(prev => ({
                ...prev,
                submit: error.message
              }));
            }
          }
        );
      }
    } catch (error) {
      console.error('Error submitting form:', error.message);
      setFormErrors(prev => ({
        ...prev,
        submit: 'An unexpected error occurred. Please try again.'
      }));
    }
  };

  // Handle service deletion
  const handleDeleteService = async (service) => {
    if (!service || !service.id) {
      console.error('Invalid service object or missing ID:', service);
      alert('Cannot delete service: Invalid service data');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the service "${service.nombre}"?`)) {
      try {
        await deleteService.mutateAsync(
          service.id,
          {
            onSuccess: () => {
              console.log(`Service ${service.nombre} deleted successfully`);
              refetch();
            },
            onError: (error) => {
              console.error('Error deleting service:', error.message);
              alert(`Failed to delete service: ${error.message}`);
            }
          }
        );
      } catch (error) {
        console.error('Error deleting service:', error.message);
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent align-[-0.125em]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-4 text-lg text-[#4A453F]">Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-sm text-red-700">
          <h2 className="text-xl font-semibold mb-2">Error loading services</h2>
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
        <h2 className="text-xl font-semibold text-[#4A453F] mb-4 md:mb-0">Services</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={handleAddService}
            className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors"
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="searchInput" className="block text-sm font-medium text-[#4A453F] mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="searchInput"
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                aria-label="Search services by name"
              />
            </div>
          </div>
            
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-[#4A453F] mb-1">
              Category
            </label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent appearance-none bg-white"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {servicesData?.categories?.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-[#4A453F] mb-1">
              Show
            </label>
            <select
              id="limit"
              name="limit"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent appearance-none bg-white"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Services Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent align-[-0.125em]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
              </div>
              <p className="mt-2 text-[#4A453F]">Loading services...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-medium">Error loading services</p>
            <p>{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812]"
            >
              Retry
            </button>
          </div>
        ) : servicesData?.rows.length === 0 ? (
          <div className="p-8 text-center text-[#4A453F]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-lg font-medium">No services found</p>
            <p className="text-gray-500 mt-1">Try adjusting your filters or add a new service.</p>
            <button
              onClick={handleAddService}
              className="mt-4 px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812]"
            >
              + Add Service
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('nombre')}
                >
                  Name {getSortIndicator('nombre')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSortChange('categoria')}
                >
                  Category {getSortIndicator('categoria')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#4A453F] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {servicesData.rows.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#4A453F]">{service.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {service.categoria || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#4A453F]">
                      {service.descripcion ? service.descripcion : <span className="text-gray-400 italic">No description</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditService(service)}
                      className="text-[#F58220] hover:text-[#e67812] mr-3"
                      aria-label={`Edit ${service.nombre}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteService(service)}
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Delete ${service.nombre}`}
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
      
      {/* Pagination */}
      {servicesData && servicesData.totalPages > 1 && (
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 mt-4">
          <div className="flex-1 flex justify-between items-center">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-[#4A453F] hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-[#4A453F]">
              Page {page} of {servicesData.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === servicesData.totalPages}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                page === servicesData.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-[#4A453F] hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal for adding/editing services */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-6 text-[#4A453F] border-b border-gray-200 pb-3">
                {selectedService ? 'Edit Service' : 'Add New Service'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="nombre" className="block text-sm font-medium text-[#4A453F] mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={serviceForm.nombre}
                    onChange={handleFormChange}
                    className={`w-full px-3 py-2 border ${
                      formErrors.nombre ? 'border-red-500' : 'border-gray-200'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                    required
                  />
                  {formErrors.nombre && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.nombre}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="categoria" className="block text-sm font-medium text-[#4A453F] mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="categoria"
                    name="categoria"
                    value={serviceForm.categoria}
                    onChange={handleFormChange}
                    className={`w-full px-3 py-2 border ${
                      formErrors.categoria ? 'border-red-500' : 'border-gray-200'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent`}
                    required
                  />
                  {formErrors.categoria && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.categoria}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label htmlFor="descripcion" className="block text-sm font-medium text-[#4A453F] mb-1">
                    Description
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={serviceForm.descripcion}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220] focus:border-transparent"
                  ></textarea>
                </div>
                
                {formErrors.submit && (
                  <div className="mb-4 p-3 bg-red-100 rounded-md text-red-700">
                    {formErrors.submit}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] transition-colors"
                  >
                    {selectedService ? 'Update Service' : 'Add Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiciosManagement; 