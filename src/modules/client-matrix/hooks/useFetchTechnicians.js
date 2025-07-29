import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch technicians with optional filtering and pagination
 * @param {Object} params - Query parameters
 * @param {Object} params.options - React Query options (e.g., staleTime, cacheTime)
 * @param {Object} params.filters - Filter parameters (nombre, especialidad, estado)
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Number of items per page
 * @param {string} params.sortBy - Field to sort by
 * @param {string} params.sortDir - Sort direction ('ASC' or 'DESC')
 * @returns {Object} Query result with data, loading state, and error
 */
const useFetchTechnicians = ({
  options = {},
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'nombre',
  sortDir = 'ASC'
} = {}) => {
  return useQuery({
    queryKey: ['technicians', filters, page, limit, sortBy, sortDir],
    queryFn: async () => {
      try {
        console.log('Fetching technicians with params:', {
          filters,
          page,
          limit,
          sortBy,
          sortDir
        });

        // Build query parameters for API call
        const queryParams = new URLSearchParams();
        
        // Add filters if they exist
        if (filters.nombre) {
          queryParams.append('nombre', filters.nombre);
        }
        
        if (filters.especialidad) {
          queryParams.append('especialidad', filters.especialidad);
        }
        
        if (filters.estado) {
          queryParams.append('estado', filters.estado);
        }
        
        // Add pagination
        queryParams.append('page', page);
        queryParams.append('limit', limit);
        
        // Add sorting
        queryParams.append('sortBy', sortBy || 'nombre');
        queryParams.append('sortDir', sortDir || 'ASC');
        
        // Make API call - authFetch returns parsed JSON directly
        const data = await authFetch(
          buildApiUrl(`/api/tecnicos?${queryParams.toString()}`)
        );
        
        // Return data
        return data.data;
      } catch (error) {
        console.error('Error fetching technicians:', error);
        throw error;
      }
    },
    keepPreviousData: true,
    ...options
  });
};

export default useFetchTechnicians; 