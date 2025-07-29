import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch dashboard data
 * @returns {Object} Query result with dashboard data
 */
const useFetchDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const data = await authFetch('/api/salespersons/dashboard');
      
      return data.data;
    }
  });
};

export default useFetchDashboardData; 