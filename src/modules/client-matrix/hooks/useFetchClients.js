import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch clients with optional filtering and pagination
 * @param {Object} params - Query parameters
 * @param {Object} params.options - React Query options (e.g., staleTime, cacheTime)
 * @param {Object} params.filters - Filter parameters (nombre, vendedorId, tecnicoId, contratoSoporte, estado)
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Number of items per page
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortDir - Sort direction ('ASC' or 'DESC')
 * @returns {Object} Query result with data, loading state, and error
 */
const useFetchClients = ({
  options = {},
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'nombre',
  sortDir = 'ASC'
}) => {
  console.log('Fetching clients with filters:', filters);
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  // Add filters to query params, but only if they have a value
  if (filters.nombre) queryParams.append('nombre', filters.nombre);
  if (filters.vendedorId) queryParams.append('vendedorId', filters.vendedorId);
  if (filters.tecnicoId) queryParams.append('tecnicoId', filters.tecnicoId);
  if (filters.contratoSoporte === true || filters.contratoSoporte === false) {
    queryParams.append('contratoSoporte', filters.contratoSoporte);
  }
  if (filters.estado) queryParams.append('estado', filters.estado);
  
  // Add pagination and sorting params
  queryParams.append('page', page);
  queryParams.append('limit', limit);
  queryParams.append('sortBy', sortBy);
  queryParams.append('sortDir', sortDir);
  
  // Create query key with all parameters for proper caching
  const queryKey = ['clients', filters, page, limit, sortBy, sortDir];
  
  // The final URL with query parameters
  const url = `${buildApiUrl('/api/clientes')}?${queryParams.toString()}`;
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`Fetching clients from: ${url}`);
      
      const data = await authFetch(url);
      
      console.log(`Fetched ${data.data.count} clients`);
      return data.data;
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

export default useFetchClients; 