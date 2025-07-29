import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../utils/apiConfig';
import { authFetch } from '../utils/fetch-wrapper';

/**
 * Custom hook for fetching salesperson data
 * @param {Object} params - Query parameters
 * @param {Object} params.filters - Optional filters (estado, etc.)
 * @param {Number} params.page - Page number for pagination
 * @param {Number} params.limit - Items per page for pagination
 * @param {String} params.sortBy - Field to sort by
 * @param {String} params.sortOrder - Sort order (asc or desc)
 * @returns {Object} Query result object with data, isLoading, and error
 */
const useFetchSalespersons = ({
  page = 1,
  limit = 10,
  filters = {},
  sortBy = 'nombre',
  sortOrder = 'asc',
} = {}) => {
  const queryParams = {
    page,
    limit,
    sortBy,
    sortOrder,
    ...filters
  };

  // Build query string from parameters
  const queryString = Object.keys(queryParams).length
    ? `?${Object.entries(queryParams)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')}`
    : '';

  return useQuery({
    queryKey: ['salespersons', page, limit, filters, sortBy, sortOrder],
    queryFn: async () => {
      console.log(`Fetching salespersons with params: ${queryString}`);
      const data = await authFetch(`/api/salespersons${queryString}`);
      return data;
    },
    select: (data) => data.data,
  });
};

export default useFetchSalespersons; 