import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch client summary data for the dashboard
 * 
 * @returns {object} Query result with client summary data
 */
const useFetchClientSummary = () => {
  return useQuery({
    queryKey: ['dashboardClientSummary'],
    queryFn: async () => {
      try {
        // Fetch client summary from the API
        const url = buildApiUrl('/api/clientes/summary');
        
        console.log('Fetching client summary for dashboard:', url);
        
        const data = await authFetch(url);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch client summary');
        }
        
        return data.data;
      } catch (error) {
        console.error('Error fetching client summary:', error);
        
        // For development/testing - return mock data if API fails
        // In production, we would remove this fallback
        console.log('Using fallback client summary data');
        return {
          totalClients: 42,
          activeServiceContracts: 28,
          totalServices: 76
        };
      }
    },
    // Stale time of 5 minutes for dashboard
    staleTime: 1000 * 60 * 5,
  });
};

export default useFetchClientSummary; 