import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch quantitative objectives with pagination and filters
 * 
 * @param {number} page - Current page number
 * @param {number} limit - Number of items per page
 * @param {object} filters - Filter options
 * @returns {object} Query result with data, isLoading, error, and refetch
 */
const useFetchQuantitativeObjectives = (page = 1, limit = 10, filters = {}) => {
  return useQuery({
    queryKey: ['quantitativeObjectives', page, limit, filters],
    queryFn: async () => {
      try {
        // Build URL with query parameters
        let url = buildApiUrl('/api/quantitative-objectives');
        const queryParams = new URLSearchParams();
        
        // Add pagination params
        queryParams.append('page', page);
        queryParams.append('limit', limit);
        
        // Add filters if provided
        if (filters.name) {
          queryParams.append('name', filters.name);
        }
        
        if (filters.type) {
          queryParams.append('type', filters.type);
        }
        
        if (filters.isGlobal && filters.isGlobal !== 'all') {
          queryParams.append('isGlobal', filters.isGlobal);
        }
        
        if (filters.hasAssignments && filters.hasAssignments !== 'all') {
          queryParams.append('hasAssignments', filters.hasAssignments);
        }
        
        // Append query params to URL
        url = `${url}?${queryParams.toString()}`;
        
        console.log('Fetching quantitative objectives:', url);
        
        const data = await authFetch(url);
        console.log('Fetched quantitative objectives:', data);
        
        return data.success ? data.data : Promise.reject(data.error);
      } catch (error) {
        console.error('Error fetching quantitative objectives:', error);
        throw error;
      }
    },
    // Keep previous data until new data is fetched
    keepPreviousData: true,
    // Refetch on window focus
    refetchOnWindowFocus: false,
    // Only retry once
    retry: 1,
    // Stale time of 5 minutes
    staleTime: 1000 * 60 * 5,
  });
};

export default useFetchQuantitativeObjectives; 