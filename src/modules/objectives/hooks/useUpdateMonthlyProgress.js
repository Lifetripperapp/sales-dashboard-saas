import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to update monthly progress for a salesperson's quantitative objective
 * 
 * @returns {object} Mutation object
 */
const useUpdateMonthlyProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ salespersonId, assignmentId, month, value }) => {
      if (!salespersonId || !assignmentId || !month || value === undefined) {
        throw new Error('Missing required parameters');
      }
      
      console.log(`API call: POST to /api/salespersons/${salespersonId}/objectives/monthly`, {
        assignmentId, month, value
      });
      
      const responseData = await authFetch(buildApiUrl(`/api/salespersons/${salespersonId}/objectives/monthly`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignmentId,
          month,
          value
        })
      });
      
      console.log('API success response:', responseData);
      return responseData;
    },
    onSuccess: (data, variables) => {
      console.log('Mutation successful, invalidating queries', variables);
      
      // Immediately update the specific salesperson's objectives in the cache
      queryClient.invalidateQueries({ 
        queryKey: ['salespersonObjectives', variables.salespersonId] 
      });
      
      // Also invalidate the general quantitative objectives cache
      queryClient.invalidateQueries({ 
        queryKey: ['quantitativeObjectives'] 
      });
      
      // Trigger a refresh of any dashboard data that might be affected
      queryClient.invalidateQueries({
        queryKey: ['salespersonStats', variables.salespersonId]
      });
    },
    onError: (error, variables) => {
      console.error('Failed to update monthly progress:', error, variables);
    }
  });
};

export default useUpdateMonthlyProgress; 