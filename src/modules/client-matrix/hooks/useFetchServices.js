import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch services with optional filtering and pagination
 * @param {Object} params - Query parameters
 * @param {Object} params.filters - Filter parameters (nombre, categoria)
 * @param {Object} params.options - Other options (estado)
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Number of items per page
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortDir - Sort direction ('ASC' or 'DESC')
 * @returns {Object} Query result with data, loading state, and error
 */
const useFetchServices = ({
  filters = {},
  options = {},
  page = 1,
  limit = 10,
  sortBy = 'nombre',
  sortDir = 'ASC'
}) => {
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  // Add filters to query params
  if (filters.nombre) {
    queryParams.append('nombre', filters.nombre);
  }
  
  if (filters.categoria) {
    queryParams.append('categoria', filters.categoria);
  }
  
  if (options.estado) {
    queryParams.append('estado', options.estado);
  }
  
  // Add pagination and sorting params
  queryParams.append('page', page);
  queryParams.append('limit', limit);
  queryParams.append('sortBy', sortBy);
  queryParams.append('sortDir', sortDir);
  
  // The final URL with query parameters
  const url = `${buildApiUrl('/api/servicios')}?${queryParams.toString()}`;
  
  // Create query key with all parameters for proper caching
  const queryKey = ['services', { ...filters, ...options }, page, limit, sortBy, sortDir];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`Fetching services from: ${url} with filters:`, filters);
      
      const data = await authFetch(url);
      
      console.log(`Fetched ${data.data.count} services`);
      return data.data;
    },
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    ...options
  });
};

export default useFetchServices; 