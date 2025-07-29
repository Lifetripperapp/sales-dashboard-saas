import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook for updating the status of a qualitative objective
 * @returns {Object} The mutation object with update function
 */
const useUpdateQualitativeObjectiveStatus = () => {
  const queryClient = useQueryClient();
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      if (!id) {
        throw new Error('Objective ID is required');
      }
      
      if (!status) {
        throw new Error('Status is required');
      }
      
      const result = await authFetch(buildApiUrl(`/api/qualitative/${id}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      return result;
    },
    onSuccess: (data, variables) => {
      // More specific cache invalidation - only invalidate the specific objective
      // and the salesperson that owns it
      console.log('Status update successful for objective ID:', variables.id);
      
      // First, update the specific objective data in the cache
      queryClient.setQueryData(
        ['qualitativeObjective', variables.id],
        (oldData) => {
          if (oldData) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                status: variables.status
              }
            };
          }
          return oldData;
        }
      );
      
      // Then invalidate specific queries that need to be refreshed
      queryClient.invalidateQueries({ queryKey: ['qualitativeObjective', variables.id] });
      
      // For the salesperson detail view, we need to be more targeted
      // Instead of invalidating all salespersons, only refetch the current one
      const existingSalespersonData = queryClient.getQueriesData({ 
        queryKey: ['salesperson'] 
      });
      
      // For each salesperson query, we only update the matching objective
      existingSalespersonData.forEach(([queryKey, queryData]) => {
        if (queryData && queryData.data && queryData.data.qualitativeObjectives) {
          // Find if this salesperson has the objective we're updating
          const hasObjective = queryData.data.qualitativeObjectives.some(
            obj => obj.id === variables.id
          );
          
          if (hasObjective) {
            // Update just this one objective's status in the salesperson data
            queryClient.setQueryData(queryKey, (oldData) => {
              if (!oldData || !oldData.data || !oldData.data.qualitativeObjectives) {
                return oldData;
              }
              
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  qualitativeObjectives: oldData.data.qualitativeObjectives.map(obj => 
                    obj.id === variables.id 
                      ? {...obj, status: variables.status} 
                      : obj
                  )
                }
              };
            });
            
            // Then invalidate this specific salesperson query
            queryClient.invalidateQueries({ queryKey });
          }
        }
      });
    },
  });
  
  return {
    updateStatus: updateStatusMutation,
  };
};

export default useUpdateQualitativeObjectiveStatus; 