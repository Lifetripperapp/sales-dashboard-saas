import { useMutation } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Hook to run a health check on client-service associations
 * This identifies and fixes common issues such as:
 * - Missing required fields
 * - Invalid references
 * - Duplicate entries
 */
const useClientServiceHealthCheck = () => {
  return useMutation({
    mutationFn: async () => {
      console.log('[DEBUG] Running client-service health check');
      
      try {
        const data = await authFetch(buildApiUrl('/api/cliente-servicios/health-check'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('[DEBUG] Health check complete:', data);
        
        // Log issues found
        if (data.report.issues.length > 0) {
          console.warn('[DEBUG] Health check found issues:', data.report.issues);
        }
        
        // Log fixes applied
        if (data.report.fixed.length > 0) {
          console.info('[DEBUG] Health check applied fixes:', data.report.fixed);
        }
        
        return data;
      } catch (error) {
        console.error('[DEBUG] Exception during health check:', error);
        throw error;
      }
    }
  });
};

export default useClientServiceHealthCheck; 