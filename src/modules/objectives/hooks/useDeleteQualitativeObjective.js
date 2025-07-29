import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to delete a qualitative objective
 * @returns {Object} The mutation object with delete function
 */
const useDeleteQualitativeObjective = () => {
  const queryClient = useQueryClient();
  
  const deleteObjectiveMutation = useMutation({
    mutationFn: async (id) => {
      if (!id) {
        throw new Error('Objective ID is required');
      }
      
      const result = await authFetch(buildApiUrl(`/api/qualitative/${id}`), {
        method: 'DELETE',
      });
      
      return result;
    },
    onSuccess: () => {
      // Invalidate qualitative objectives queries when deletion succeeds
      queryClient.invalidateQueries({ queryKey: ['qualitativeObjectives'] });
    },
  });
  
  return {
    deleteObjective: deleteObjectiveMutation,
  };
};

export default useDeleteQualitativeObjective; 