import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook for updating the evidence URL of a qualitative objective
 * @returns {Object} The mutation object with update function
 */
const useUpdateQualitativeObjectiveEvidence = () => {
  const queryClient = useQueryClient();
  
  const updateEvidenceMutation = useMutation({
    mutationFn: async ({ id, evidence }) => {
      if (!id) {
        throw new Error('Objective ID is required');
      }
      
      if (!evidence) {
        throw new Error('Evidence URL is required');
      }
      
      const result = await authFetch(buildApiUrl(`/api/qualitative/${id}/evidence`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ evidence }),
      });
      
      return result;
    },
    onSuccess: () => {
      // Invalidate qualitative objectives queries when evidence is updated
      queryClient.invalidateQueries({ queryKey: ['qualitativeObjectives'] });
    },
  });
  
  return {
    updateEvidence: updateEvidenceMutation,
  };
};

export default useUpdateQualitativeObjectiveEvidence; 