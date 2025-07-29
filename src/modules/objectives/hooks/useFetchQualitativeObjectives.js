import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook for fetching qualitative objectives
 * @param {Number} page - Page number for pagination
 * @param {Number} pageSize - Items per page for pagination
 * @param {Object} filters - Optional filters (name, status, salespersonId, isGlobal)
 * @param {String} sortBy - Field to sort by
 * @param {String} sortOrder - Sort order (asc or desc)
 * @returns {Object} Query result object with data, isLoading, and error
 */
const useFetchQualitativeObjectives = (
  page = 1,
  pageSize = 10,
  filters = {},
  sortBy = 'createdAt',
  sortOrder = 'desc'
) => {
  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('limit', pageSize);
  queryParams.append('sortBy', sortBy);
  queryParams.append('sortOrder', sortOrder);
  
  // Add filters to query params, but only if they have a value
  if (filters.name) queryParams.append('name', filters.name);
  if (filters.salespersonId) queryParams.append('salespersonId', filters.salespersonId);
  if (filters.status) queryParams.append('status', filters.status);
  // Only add isGlobal if it's not set to 'all'
  if (filters.isGlobal !== undefined && filters.isGlobal !== 'all') {
    queryParams.append('isGlobal', filters.isGlobal);
  }
  
  // Add pagination and sorting params
  const queryString = queryParams.toString();
  
  return useQuery({
    queryKey: ['qualitativeObjectives', page, pageSize, filters, sortBy, sortOrder],
    queryFn: async () => {
      console.log(`Fetching qualitative objectives with params: ${queryString}`);
      const data = await authFetch(buildApiUrl(`/api/qualitative?${queryString}`));
      
      return data.data;
    },
  });
};

export default useFetchQualitativeObjectives; 