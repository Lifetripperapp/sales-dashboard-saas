import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to create a new technician evaluation
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useCreateTechnicianEvaluation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ technicianId, evaluationData }) => {
      console.log(`Creating evaluation for technician ${technicianId} with data:`, evaluationData);
      
      const data = await authFetch(buildApiUrl(`/api/tecnicos/${technicianId}/evaluations`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      });
      
      console.log('Evaluation created successfully:', data.data.id);
      return data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate evaluations queries to refetch data
      queryClient.invalidateQueries({ 
        queryKey: ['technician', variables.technicianId, 'evaluations'] 
      });
      queryClient.invalidateQueries({
        queryKey: ['technician', variables.technicianId, 'latestEvaluation', 
          variables.evaluationData.year, variables.evaluationData.semester]
      });
    },
  });
};

/**
 * Custom hook to update an existing technician evaluation
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useUpdateTechnicianEvaluation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ technicianId, evaluationId, evaluationData }) => {
      console.log(`Updating evaluation ${evaluationId} for technician ${technicianId} with data:`, evaluationData);
      
      const data = await authFetch(buildApiUrl(`/api/tecnicos/${technicianId}/evaluations/${evaluationId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      });
      
      console.log('Evaluation updated successfully:', data.data.id);
      return data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific evaluation and evaluations list
      queryClient.invalidateQueries({ 
        queryKey: ['technician', variables.technicianId, 'evaluation', variables.evaluationId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['technician', variables.technicianId, 'evaluations'] 
      });
      queryClient.invalidateQueries({
        queryKey: ['technician', variables.technicianId, 'latestEvaluation', 
          variables.evaluationData.year, variables.evaluationData.semester]
      });
    },
  });
};

/**
 * Custom hook to delete a technician evaluation
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useDeleteTechnicianEvaluation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ technicianId, evaluationId }) => {
      console.log(`Deleting evaluation ${evaluationId} for technician ${technicianId}`);
      
      const data = await authFetch(buildApiUrl(`/api/tecnicos/${technicianId}/evaluations/${evaluationId}`), {
        method: 'DELETE',
      });
      
      console.log('Evaluation deleted successfully:', evaluationId);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate evaluations queries to refetch data
      queryClient.invalidateQueries({ 
        queryKey: ['technician', variables.technicianId, 'evaluations'] 
      });
      // No need to invalidate the specific evaluation since it's deleted
    },
  });
};

/**
 * Combined hook for all technician evaluation CRUD operations
 * @returns {Object} Object containing all evaluation CRUD mutation hooks
 */
const useSaveTechnicianEvaluation = () => {
  const createEvaluation = useCreateTechnicianEvaluation();
  const updateEvaluation = useUpdateTechnicianEvaluation();
  const deleteEvaluation = useDeleteTechnicianEvaluation();
  
  return {
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
  };
};

export default useSaveTechnicianEvaluation; 