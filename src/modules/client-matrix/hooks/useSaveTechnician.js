import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to create a new technician
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useCreateTechnician = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (technicianData) => {
      console.log('Creating technician with data:', technicianData);
      
      const data = await authFetch(buildApiUrl('/api/tecnicos'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(technicianData),
      });
      
      console.log('Technician created successfully:', data.data.id);
      return data.data;
    },
    onSuccess: () => {
      // Invalidate technicians query to refetch data
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });
};

/**
 * Custom hook to update an existing technician
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useUpdateTechnician = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...technicianData }) => {
      console.log(`Updating technician ${id} with data:`, technicianData);
      
      const data = await authFetch(buildApiUrl(`/api/tecnicos/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(technicianData),
      });
      
      console.log('Technician updated successfully:', data.data.id);
      return data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific technician and technicians list
      queryClient.invalidateQueries({ queryKey: ['technicians', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      
      // Also invalidate clients that might be associated with this technician
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

/**
 * Custom hook to delete a technician
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useDeleteTechnician = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, force = false }) => {
      console.log(`[DELETE-HOOK] Deleting technician ${id}${force ? ' with force option' : ''}`);
      
      let url = buildApiUrl(`/api/tecnicos/${id}`);
      if (force) {
        url = `${url}?force=true`;
        console.log(`[DELETE-HOOK] Adding force=true parameter. Final URL: ${url}`);
      } else {
        console.log(`[DELETE-HOOK] No force parameter. Final URL: ${url}`);
      }
      
      const data = await authFetch(url, {
        method: 'DELETE',
      });
      
      console.log(`[DELETE-HOOK] Delete operation completed successfully`);
      console.log('[DELETE-HOOK] Technician deleted successfully:', id, data.unassignedClients ? `(${data.unassignedClients} clients unassigned)` : '');
      return data;
    },
    onSuccess: (data) => {
      // Invalidate technicians query to refetch data
      console.log('[DELETE-HOOK] Invalidating technicians query after successful deletion');
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      
      // If clients were unassigned, also invalidate clients data
      if (data.unassignedClients > 0) {
        console.log(`[DELETE-HOOK] Also invalidating clients query (${data.unassignedClients} unassigned)`);
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
    },
  });
};

/**
 * Combined hook for all technician CRUD operations
 * @returns {Object} Object containing all technician CRUD mutation hooks
 */
const useSaveTechnician = () => {
  const createTechnician = useCreateTechnician();
  const updateTechnician = useUpdateTechnician();
  const deleteTechnician = useDeleteTechnician();
  
  return {
    createTechnician,
    updateTechnician,
    deleteTechnician,
  };
};

export default useSaveTechnician; 