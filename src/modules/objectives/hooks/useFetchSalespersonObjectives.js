import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch quantitative objectives for a specific salesperson
 * 
 * @param {string} salespersonId - ID of the salesperson
 * @returns {object} Query result with data, isLoading, error, and refetch
 */
const useFetchSalespersonObjectives = (salespersonId) => {
  return useQuery({
    queryKey: ['salespersonObjectives', salespersonId],
    queryFn: async () => {
      try {
        if (!salespersonId) {
          throw new Error('Salesperson ID is required');
        }
        
        const url = buildApiUrl(`/api/salespersons/${salespersonId}/objectives`);
        
        console.log('Fetching salesperson objectives:', url);
        
        const data = await authFetch(url);
        console.log('Fetched salesperson objectives:', data);
        
        return data.success ? data.data : Promise.reject(data.error);
      } catch (error) {
        console.error('Error fetching salesperson objectives:', error);
        throw error;
      }
    },
    // Disable the query if no salespersonId is provided
    enabled: !!salespersonId,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Only retry once
    retry: 1,
    // Stale time of 1 minute
    staleTime: 1000 * 60
  });
};

export default useFetchSalespersonObjectives; 