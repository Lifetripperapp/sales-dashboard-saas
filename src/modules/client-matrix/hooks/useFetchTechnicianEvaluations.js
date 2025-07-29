import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to fetch evaluations for a specific technician
 * @param {string} technicianId - ID of the technician
 * @param {Object} filters - Optional filters (year, semester)
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data, loading state, and error
 */
const useFetchTechnicianEvaluations = (technicianId, filters = {}, options = {}) => {
  console.log(`Fetching evaluations for technician ${technicianId} with filters:`, filters);
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  
  // Add filters to query params
  if (filters.year) queryParams.append('year', filters.year);
  if (filters.semester) queryParams.append('semester', filters.semester);
  
  // Create query key with all parameters for proper caching
  const queryKey = ['technician', technicianId, 'evaluations', filters];
  
  // The final URL with query parameters
  const url = `${buildApiUrl(`/api/tecnicos/${technicianId}/evaluations`)}?${queryParams.toString()}`;
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`Fetching evaluations from: ${url}`);
      
      if (!technicianId) {
        return { rows: [] };
      }
      
      const data = await authFetch(url);
      
      console.log(`Fetched ${data.data.length} evaluations`);
      return data.data;
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!technicianId, // Only run query if technicianId is provided
    ...options
  });
};

/**
 * Custom hook to fetch a specific evaluation
 * @param {string} technicianId - ID of the technician
 * @param {string} evaluationId - ID of the evaluation
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data, loading state, and error
 */
export const useFetchTechnicianEvaluation = (technicianId, evaluationId, options = {}) => {
  console.log(`Fetching evaluation ${evaluationId} for technician ${technicianId}`);
  
  // Create query key with all parameters for proper caching
  const queryKey = ['technician', technicianId, 'evaluation', evaluationId];
  
  // The URL for the specific evaluation
  const url = buildApiUrl(`/api/tecnicos/${technicianId}/evaluations/${evaluationId}`);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`Fetching evaluation from: ${url}`);
      
      if (!technicianId || !evaluationId) {
        return null;
      }
      
      const data = await authFetch(url);
      
      console.log(`Fetched evaluation ${evaluationId}`);
      return data.data;
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!technicianId && !!evaluationId, // Only run query if both IDs are provided
    ...options
  });
};

/**
 * Custom hook to fetch the latest evaluation for a technician by year and semester
 * @param {string} technicianId - ID of the technician
 * @param {number} year - Year to filter
 * @param {string} semester - Semester to filter (H1 or H2)
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data, loading state, and error
 */
export const useFetchLatestTechnicianEvaluation = (technicianId, year, semester, options = {}) => {
  console.log(`Fetching latest evaluation for technician ${technicianId} for ${year} ${semester}`);
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('year', year);
  queryParams.append('semester', semester);
  
  // Create query key with all parameters for proper caching
  const queryKey = ['technician', technicianId, 'latestEvaluation', year, semester];
  
  // The final URL with query parameters
  const url = `${buildApiUrl(`/api/tecnicos/${technicianId}/evaluations`)}?${queryParams.toString()}`;
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log(`Fetching latest evaluation from: ${url}`);
      
      if (!technicianId || !year || !semester) {
        return null;
      }
      
      const data = await authFetch(url);
      
      const evaluations = data.data;
      
      if (evaluations.length === 0) {
        console.log(`No evaluation found for ${year} ${semester}`);
        return null;
      }
      
      // Return the first evaluation (should be the only one for this year/semester)
      console.log(`Fetched latest evaluation for ${year} ${semester}`);
      return evaluations[0];
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!technicianId && !!year && !!semester, // Only run query if all parameters are provided
    ...options
  });
};

export default useFetchTechnicianEvaluations; 