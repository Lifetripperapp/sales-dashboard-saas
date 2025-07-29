import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to create a new service
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useCreateService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (serviceData) => {
      console.log('Creating service with data:', serviceData);
      
      const data = await authFetch(buildApiUrl('/api/servicios'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });
      
      console.log('Service created successfully:', data.data.id);
      return data.data;
    },
    onSuccess: () => {
      // Invalidate services query to refetch data
      queryClient.invalidateQueries({ queryKey: ['services'] });
      
      // Also invalidate matrix data as it includes services
      queryClient.invalidateQueries({ queryKey: ['matrixData'] });
    },
  });
};

/**
 * Custom hook to update an existing service
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useUpdateService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...serviceData }) => {
      console.log(`Updating service ${id} with data:`, serviceData);
      
      const data = await authFetch(buildApiUrl(`/api/servicios/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });
      
      console.log('Service updated successfully:', data.data.id);
      return data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific service and services list
      queryClient.invalidateQueries({ queryKey: ['services', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      
      // Also invalidate matrix data as it includes services
      queryClient.invalidateQueries({ queryKey: ['matrixData'] });
    },
  });
};

/**
 * Custom hook to delete a service
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useDeleteService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      console.log(`Deleting service ${id}`);
      
      const data = await authFetch(buildApiUrl(`/api/servicios/${id}`), {
        method: 'DELETE',
      });
      
      console.log('Service deleted successfully:', id);
      return data;
    },
    onSuccess: () => {
      // Invalidate services query to refetch data
      queryClient.invalidateQueries({ queryKey: ['services'] });
      
      // Also invalidate matrix data as it includes services
      queryClient.invalidateQueries({ queryKey: ['matrixData'] });
    },
  });
};

/**
 * Combined hook for all service CRUD operations
 * @returns {Object} Object containing all service CRUD mutation hooks
 */
const useSaveService = () => {
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  
  return {
    createService,
    updateService,
    deleteService,
  };
};

export default useSaveService; 