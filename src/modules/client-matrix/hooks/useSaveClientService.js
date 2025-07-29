import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to assign a service to a client
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useAssignService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clientId, serviceId, fechaAsignacion = new Date(), notas = '' }) => {
      console.log(`[DEBUG] API Call: Assigning service ${serviceId} to client ${clientId}`);
      
      // Prepare payload with exact field names expected by the server
      const payload = {
        clientId,
        servicioId: serviceId,
        fechaAsignacion: fechaAsignacion.toISOString(),
        notas: notas || ''
      };
      
      console.log('[DEBUG] API Request Payload:', JSON.stringify(payload));
      
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const data = await authFetch(buildApiUrl('/api/cliente-servicios'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          
          console.log('[DEBUG] API Response successful:', data);
          
          // Service is already assigned but this is not an error
          if (data.message === 'Service is already assigned to this client') {
            console.log('[DEBUG] Service already assigned, treating as success');
            return data.data;
          }
          
          console.log('[DEBUG] Service assigned successfully:', data.data.id);
          return data.data;
        } catch (error) {
          // If we've exhausted all retries, throw the error
          if (retryCount === maxRetries) {
            console.error('[DEBUG] Exception during API call after all retries:', error);
            throw error;
          }
          
          // Otherwise, increment retry count and try again
          retryCount++;
          console.log(`[DEBUG] Retrying assign request after error (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
      // This shouldn't be reachable, but just in case
      throw new Error('Failed to assign service after maximum retries');
    },
    onSuccess: (data, variables) => {
      console.log('[DEBUG] Mutation success, invalidating queries');
      // Invalidate client services
      queryClient.invalidateQueries({ queryKey: ['clientServices', variables.clientId] });
      
      // Invalidate service clients 
      queryClient.invalidateQueries({ queryKey: ['serviceClients', variables.serviceId] });
      
      // Also invalidate matrix data
      queryClient.invalidateQueries({ queryKey: ['matrixData'] });
    },
    onError: (error) => {
      console.error('[DEBUG] Mutation error:', error);
    }
  });
};

/**
 * Custom hook to update client-service association
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useUpdateClientService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, notas }) => {
      console.log(`[DEBUG] Updating client-service association ${id}`);
      
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const data = await authFetch(buildApiUrl(`/api/cliente-servicios/${id}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notas }),
          });
          
          console.log('[DEBUG] Update API Response successful:', data);
          console.log('[DEBUG] Client-service association updated successfully:', data.data.id);
          return data.data;
        } catch (error) {
          // If we've exhausted all retries, throw the error
          if (retryCount === maxRetries) {
            console.error('[DEBUG] Exception during update API call after all retries:', error);
            throw error;
          }
          
          // Otherwise, increment retry count and try again
          retryCount++;
          console.log(`[DEBUG] Retrying update request after error (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
      // This shouldn't be reachable, but just in case
      throw new Error('Failed to update service association after maximum retries');
    },
    onSuccess: (data) => {
      // Invalidate client services
      queryClient.invalidateQueries({ queryKey: ['clientServices', data.clientId] });
      
      // Invalidate service clients
      queryClient.invalidateQueries({ queryKey: ['serviceClients', data.serviceId] });
      
      // Also invalidate matrix data
      queryClient.invalidateQueries({ queryKey: ['matrixData'] });
    },
  });
};

/**
 * Custom hook to unassign a service from a client
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useUnassignService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clientId, serviceId }) => {
      console.log(`[DEBUG] API Call: Unassigning service ${serviceId} from client ${clientId}`);
      
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const url = buildApiUrl(`/api/cliente-servicios/cliente/${clientId}/service/${serviceId}`);
          console.log('[DEBUG] API Request URL:', url);
          
          const data = await authFetch(url, {
            method: 'DELETE',
          });
          
          console.log('[DEBUG] API Response successful:', data);
          console.log('[DEBUG] Service unassigned successfully');
          return data;
        } catch (error) {
          // If we've exhausted all retries, throw the error
          if (retryCount === maxRetries) {
            console.error('[DEBUG] Exception during API call after all retries:', error);
            throw error;
          }
          
          // Otherwise, increment retry count and try again
          retryCount++;
          console.log(`[DEBUG] Retrying unassign request after error (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
      // This shouldn't be reachable, but just in case
      throw new Error('Failed to unassign service after maximum retries');
    },
    onSuccess: (data, variables) => {
      console.log('[DEBUG] Unassign mutation success, invalidating queries');
      // Invalidate client services
      queryClient.invalidateQueries({ queryKey: ['clientServices', variables.clientId] });
      
      // Invalidate service clients
      queryClient.invalidateQueries({ queryKey: ['serviceClients', variables.serviceId] });
      
      // Also invalidate matrix data
      queryClient.invalidateQueries({ queryKey: ['matrixData'] });
    },
    onError: (error) => {
      console.error('[DEBUG] Unassign mutation error:', error);
    }
  });
};

/**
 * Combined hook for all client-service CRUD operations
 * @returns {Object} Object containing all client-service mutation hooks
 */
const useSaveClientService = () => {
  const assignService = useAssignService();
  const updateClientService = useUpdateClientService();
  const unassignService = useUnassignService();
  
  return {
    assignService,
    updateClientService,
    unassignService,
  };
};

export default useSaveClientService; 