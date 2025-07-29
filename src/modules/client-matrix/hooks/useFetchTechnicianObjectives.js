import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch objectives for a specific technician
 * @param {string} technicianId - ID of the technician
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data, loading state, and error
 */
const useFetchTechnicianObjectives = (technicianId, options = {}) => {
  console.log(`Fetching objectives for technician ${technicianId}`);
  
  // Create query key with technician ID for proper caching
  const queryKey = ['technician', technicianId, 'objectives'];
  
  // The URL for the technician objectives
  const url = buildApiUrl(`/api/tecnicos/${technicianId}/objectives`);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`Fetching objectives from: ${url}`);
      
      if (!technicianId) {
        return [];
      }
      
      const data = await authFetch(url);
      
      console.log(`Fetched ${data.data?.length || 0} objectives for technician ${technicianId}`);
      return data.data || [];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!technicianId, // Only run query if technicianId is provided
    ...options
  });
};

export default useFetchTechnicianObjectives; 