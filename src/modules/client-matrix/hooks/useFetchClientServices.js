import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch services assigned to a specific client
 * @param {string} clientId - ID of the client to fetch services for
 * @param {Object} options - React Query options (e.g., staleTime, cacheTime)
 * @returns {Object} Query result with data, loading state, and error
 */
const useFetchClientServices = (clientId, options = {}) => {
  // Skip the query if no clientId is provided
  const enabled = !!clientId;
  
  console.log(`Fetching services for client: ${clientId || 'No client ID provided'}`);
  
  // Create query key with clientId for proper caching
  const queryKey = ['clientServices', clientId];
  
  // The URL for the API endpoint
  const url = buildApiUrl(`/api/cliente-servicios/cliente/${clientId}`);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`Fetching client services from: ${url}`);
      
      const data = await authFetch(url);
      
      console.log(`Fetched ${data.data.length} services for client ${clientId}`);
      return data.data;
    },
    enabled,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Custom hook to fetch clients assigned to a specific service
 * @param {string} serviceId - ID of the service to fetch clients for
 * @param {Object} options - React Query options (e.g., staleTime, cacheTime)
 * @returns {Object} Query result with data, loading state, and error
 */
const useFetchServiceClients = (serviceId, options = {}) => {
  // Skip the query if no serviceId is provided
  const enabled = !!serviceId;
  
  console.log(`Fetching clients for service: ${serviceId || 'No service ID provided'}`);
  
  // Create query key with serviceId for proper caching
  const queryKey = ['serviceClients', serviceId];
  
  // The URL for the API endpoint
  const url = buildApiUrl(`/api/cliente-servicios/service/${serviceId}`);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`Fetching service clients from: ${url}`);
      
      const data = await authFetch(url);
      
      console.log(`Fetched ${data.data.length} clients for service ${serviceId}`);
      return data.data;
    },
    enabled,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Custom hook to fetch matrix data (clients and services for a matrix view)
 * @param {Object} filters - Filter parameters (vendedorId, tecnicoId)
 * @param {Object} options - React Query options (e.g., staleTime, cacheTime)
 * @returns {Object} Query result with matrix data, loading state, and error
 */
const useFetchMatrixData = (filters = {}, options = {}) => {
  console.log('Fetching matrix data with filters:', filters);
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  // Add filters to query params
  if (filters.vendedorId) queryParams.append('vendedorId', filters.vendedorId);
  if (filters.tecnicoId) queryParams.append('tecnicoId', filters.tecnicoId);
  
  // Create query key with filters for proper caching
  const queryKey = ['matrixData', filters];
  
  // The URL for the API endpoint
  const url = `${buildApiUrl('/api/clientes/matrix/data')}?${queryParams.toString()}`;
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`Fetching matrix data from: ${url}`);
      
      const data = await authFetch(url);
      
      console.log(`Fetched matrix data: ${data.data.clients.length} clients, ${data.data.services.length} services`);
      return data.data;
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

export { useFetchClientServices, useFetchServiceClients, useFetchMatrixData };
export default useFetchClientServices; 