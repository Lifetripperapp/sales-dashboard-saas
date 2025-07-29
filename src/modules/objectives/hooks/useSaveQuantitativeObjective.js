import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to save (create or update) a quantitative objective
 * 
 * @returns {object} Mutation object
 */
const useSaveQuantitativeObjective = () => {
  const queryClient = useQueryClient();
  
  const createObjective = useMutation({
    mutationFn: async (objectiveData) => {
      // Step 1: Create the objective first
      const result = await authFetch(buildApiUrl('/api/quantitative-objectives'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(objectiveData)
      });
      
      // Step 2: If this is a global objective, try to automatically assign it (but don't fail if assignment fails)
      if (objectiveData.isGlobal) {
        try {
          console.log('Attempting to assign global objective to salespersons');
          const assignResult = await authFetch(buildApiUrl('/api/quantitative-objectives/assign-global'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Global objective assigned to salespersons successfully');
        } catch (assignError) {
          console.error('Non-critical: Error in automatic assignment:', assignError);
          // Again, we don't throw an error here - the main objective was created successfully
        }
      }
      
      return result;
    },
    onSuccess: () => {
      // Invalidate the quantitative objectives query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['quantitativeObjectives'] });
      queryClient.invalidateQueries({ queryKey: ['salespersonObjectives'] });
    }
  });
  
  const updateObjective = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await authFetch(buildApiUrl(`/api/quantitative-objectives/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      return result;
    },
    onSuccess: () => {
      // Invalidate the quantitative objectives query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['quantitativeObjectives'] });
    }
  });
  
  const assignSalespersons = useMutation({
    mutationFn: async ({ id, assignments }) => {
      const result = await authFetch(buildApiUrl(`/api/quantitative-objectives/${id}/assign`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignments })
      });
      
      return result;
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['quantitativeObjectives'] });
      queryClient.invalidateQueries({ queryKey: ['salespersonObjectives'] });
    }
  });
  
  return {
    createObjective,
    updateObjective,
    assignSalespersons
  };
};

export default useSaveQuantitativeObjective; 