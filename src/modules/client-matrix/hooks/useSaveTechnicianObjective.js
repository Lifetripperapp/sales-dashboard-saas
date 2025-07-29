import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to create a new technician objective
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useCreateTechnicianObjective = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ technicianId, objective }) => {
      console.log(`Creating objective for technician ${technicianId} with data:`, objective);
      
      const data = await authFetch(buildApiUrl(`/api/tecnicos/${technicianId}/objectives`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(objective),
      });
      
      console.log('Objective created successfully:', data.data.id);
      return data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate objectives queries to refetch data
      queryClient.invalidateQueries({ 
        queryKey: ['technician', variables.technicianId, 'objectives'] 
      });
    },
  });
};

/**
 * Custom hook to update an existing technician objective
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useUpdateTechnicianObjective = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ technicianId, objectiveId, objective }) => {
      console.log(`Updating objective ${objectiveId} for technician ${technicianId} with data:`, objective);
      
      const data = await authFetch(buildApiUrl(`/api/tecnicos/${technicianId}/objectives/${objectiveId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(objective),
      });
      
      console.log('Objective updated successfully:', data.data.id);
      return data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate objectives queries to refetch data
      queryClient.invalidateQueries({ 
        queryKey: ['technician', variables.technicianId, 'objectives'] 
      });
    },
  });
};

/**
 * Custom hook to toggle objective completion status
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useToggleObjectiveCompletion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ technicianId, objectiveId, completed }) => {
      console.log(`Toggling completion for objective ${objectiveId} to ${completed}`);
      
      const data = await authFetch(buildApiUrl(`/api/tecnicos/${technicianId}/objectives/${objectiveId}/toggle-completion`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });
      
      console.log('Objective status updated successfully:', objectiveId);
      return data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate objectives queries to refetch data
      queryClient.invalidateQueries({ 
        queryKey: ['technician', variables.technicianId, 'objectives'] 
      });
    },
  });
};

/**
 * Custom hook to delete a technician objective
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useDeleteTechnicianObjective = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ technicianId, objectiveId }) => {
      console.log(`Deleting objective ${objectiveId} for technician ${technicianId}`);
      
      const data = await authFetch(buildApiUrl(`/api/tecnicos/${technicianId}/objectives/${objectiveId}`), {
        method: 'DELETE',
      });
      
      console.log('Objective deleted successfully:', objectiveId);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate objectives queries to refetch data
      queryClient.invalidateQueries({ 
        queryKey: ['technician', variables.technicianId, 'objectives'] 
      });
    },
  });
};

/**
 * Combined hook for all technician objective CRUD operations
 * @returns {Object} Object containing all objective CRUD mutation hooks
 */
const useSaveTechnicianObjective = () => {
  const createObjective = useCreateTechnicianObjective();
  const updateObjective = useUpdateTechnicianObjective();
  const toggleCompletion = useToggleObjectiveCompletion();
  const deleteObjective = useDeleteTechnicianObjective();
  
  return {
    createObjective,
    updateObjective,
    toggleCompletion,
    deleteObjective,
  };
};

export default useSaveTechnicianObjective; 