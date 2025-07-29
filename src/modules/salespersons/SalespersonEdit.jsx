import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../common/utils/apiConfig';
import { authFetch } from '../../common/utils/fetch-wrapper';

/**
 * SalespersonEdit component for creating or editing a salesperson's information
 * @returns {JSX.Element} The SalespersonEdit component
 */
const SalespersonEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Determine if we're creating a new salesperson or editing an existing one
  const isNew = !id || id === 'new';
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    estado: 'active'
  });
  
  // Form error state
  const [formErrors, setFormErrors] = useState({});
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch salesperson data for editing (only if not creating a new one)
  const { data: salesperson, isLoading, error } = useQuery({
    queryKey: ['salesperson', id],
    queryFn: async () => {
      console.log(`Fetching salesperson details for ID: ${id}`);
      // Temporarily use the basic endpoint instead of the full one
      const data = await authFetch(`/api/salespersons/${id}/basic`);
      console.log('Fetched salesperson details:', data);
      return data.data;
    },
    // Skip this query if we're creating a new salesperson
    enabled: !isNew
  });
  
  // Update form data when salesperson data is loaded
  useEffect(() => {
    if (salesperson) {
      setFormData({
        nombre: salesperson.nombre || '',
        email: salesperson.email || '',
        estado: salesperson.estado || 'active'
      });
    }
  }, [salesperson]);
  
  // Create salesperson mutation
  const createMutation = useMutation({
    mutationFn: async (newData) => {
      console.log(`Creating new salesperson`, newData);
      setIsSubmitting(true);
      
      const data = await authFetch('/api/salespersons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });
      
      return data;
    },
    onSuccess: (data) => {
      console.log('Salesperson created successfully', data);
      queryClient.invalidateQueries({ queryKey: ['salespersons'] });
      navigate(`/salespersons/${data.data.id}`);
    },
    onError: (error) => {
      console.error('Error in create mutation:', error);
      setIsSubmitting(false);
      
      // Special handling for "Email already in use" error
      if (error.message.includes('Email already in use')) {
        setFormErrors({
          ...formErrors,
          email: 'This email is already in use'
        });
      }
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  // Update salesperson mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
      console.log(`Updating salesperson with ID: ${id}`, updatedData);
      setIsSubmitting(true);
      
      const data = await authFetch(`/api/salespersons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      return data;
    },
    onSuccess: () => {
      console.log('Salesperson updated successfully');
      queryClient.invalidateQueries({ queryKey: ['salespersons'] });
      queryClient.invalidateQueries({ queryKey: ['salesperson', id] });
      navigate(`/salespersons/${id}`);
    },
    onError: (error) => {
      console.error('Error in update mutation:', error);
      setIsSubmitting(false);
      
      // Special handling for "Email already in use" error
      if (error.message.includes('Email already in use')) {
        setFormErrors({
          ...formErrors,
          email: 'This email is already in use'
        });
      }
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    
    if (!formData.nombre.trim()) {
      errors.nombre = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear errors
    setFormErrors({});
    
    // Call the appropriate mutation based on whether this is a new or existing salesperson
    if (isNew) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when the user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Don't show loading state for new salesperson
  if (isLoading && !isNew) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent align-[-0.125em]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-[#4A453F]">Loading salesperson data...</p>
        </div>
      </div>
    );
  }
  
  // Show error message but only if we're editing (not creating)
  if (error && !isNew) {
    return (
      <div className="p-6">
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          <p className="font-medium">Error loading salesperson data</p>
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
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#4A453F]">
          {isNew ? 'Create New Salesperson' : 'Edit Salesperson'}
        </h1>
        <div className="flex space-x-2">
          <Link
            to={isNew ? '/salespersons' : `/salespersons/${id}`}
            className="px-4 py-2 bg-[#4A453F] text-white rounded-md hover:bg-[#3a3632] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A453F]"
          >
            Cancel
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-[#4A453F] mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.nombre ? 'border-red-500' : 'border-[#D3D0CD]'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220]`}
              />
              {formErrors.nombre && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
              )}
            </div>
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#4A453F] mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.email ? 'border-red-500' : 'border-[#D3D0CD]'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220]`}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            
            {/* Status Field - Only show for editing */}
            {!isNew && (
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-[#4A453F] mb-1">
                  Status
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#D3D0CD] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F58220]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(isNew ? '/salespersons' : `/salespersons/${id}`)}
              className="px-4 py-2 bg-[#D3D0CD] text-[#4A453F] rounded-md hover:bg-[#BDB7B1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D3D0CD]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#F58220] text-white rounded-md hover:bg-[#e67812] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F58220] disabled:bg-[#F5822080] disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isNew ? 'Creating...' : 'Updating...'}
                </span>
              ) : (
                isNew ? 'Create Salesperson' : 'Update Salesperson'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalespersonEdit; 