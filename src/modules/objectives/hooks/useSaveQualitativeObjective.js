import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook for creating and updating qualitative objectives
 * @returns {Object} The mutation objects with create and update functions
 */
const useSaveQualitativeObjective = () => {
  const queryClient = useQueryClient();
  
  // Create a new qualitative objective
  const createMutation = useMutation({
    mutationFn: async (objective) => {
      console.log('Creating qualitative objective with data:', objective);
      
      // Make sure salespersonIds is always an array
      if (!objective.salespersonIds && !objective.isGlobal) {
        objective.salespersonIds = [];
      }
      
      const result = await authFetch(buildApiUrl('/api/qualitative'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(objective),
      });
      
      return result;
    },
    onSuccess: () => {
      // Invalidate qualitative objectives queries when a new one is created
      queryClient.invalidateQueries({ queryKey: ['qualitativeObjectives'] });
    },
  });
  
  // Update an existing qualitative objective
  const updateMutation = useMutation({
    mutationFn: async (objective) => {
      console.log('Updating qualitative objective with data:', objective);
      
      if (!objective.id) {
        throw new Error('Objective ID is required for update');
      }
      
      // Make sure salespersonIds is always an array
      if (!objective.salespersonIds && !objective.isGlobal) {
        objective.salespersonIds = [];
      }
      
      const { id, ...data } = objective;
      
      const result = await authFetch(buildApiUrl(`/api/qualitative/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return result;
    },
    onSuccess: () => {
      // Invalidate qualitative objectives queries when one is updated
      queryClient.invalidateQueries({ queryKey: ['qualitativeObjectives'] });
    },
  });
  
  return {
    createObjective: createMutation,
    updateObjective: updateMutation,
  };
};

export default useSaveQualitativeObjective; 