import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useSaveClientService from './useSaveClientService';

/**
 * Hook for managing client-service assignments with reliable persistence
 */
const useClientServiceManager = () => {
  const [pendingOperations, setPendingOperations] = useState({});
  const queryClient = useQueryClient();
  const { assignService, unassignService } = useSaveClientService();
  
  /**
   * Toggle service assignment with robust error handling and persistence
   * @param {Object} client - Client object
   * @param {Object} service - Service object
   * @param {Function} onSuccess - Optional success callback
   * @param {Function} onError - Optional error callback
   * @returns {Promise} - Promise that resolves when operation completes
   */
  const toggleServiceAssignment = async (client, service, onSuccess, onError) => {
    const isAssigned = client.servicios.some(s => s.id === service.id);
    const operationKey = `${client.id}-${service.id}`;
    
    console.log(`[DEBUG] toggleServiceAssignment: ${service.nombre} (${service.id}) for client ${client.nombre} (${client.id}), currently assigned: ${isAssigned}`);
    
    // Prevent duplicate operations
    if (pendingOperations[operationKey]) {
      console.log(`[DEBUG] Operation already in progress`);
      return;
    }
    
    // Mark operation as pending
    setPendingOperations(prev => ({ ...prev, [operationKey]: true }));
    
    try {
      if (isAssigned) {
        // Unassign service
        console.log(`[DEBUG] Calling API to unassign service ${service.id} from client ${client.id}`);
        await new Promise((resolve, reject) => {
          unassignService.mutate(
            { clientId: client.id, serviceId: service.id },
            {
              onSuccess: (result) => {
                console.log(`[DEBUG] Service ${service.id} successfully unassigned from client ${client.id}`);
                
                // Invalidate relevant queries
                queryClient.invalidateQueries({ queryKey: ['matrixData'] });
                queryClient.invalidateQueries({ queryKey: ['clientServices', client.id] });
                queryClient.invalidateQueries({ queryKey: ['serviceClients', service.id] });
                
                if (onSuccess) onSuccess(result);
                resolve(result);
              },
              onError: (error) => {
                console.error(`[DEBUG] Error unassigning service ${service.id} from client ${client.id}:`, error);
                if (onError) onError(error);
                reject(error);
              }
            }
          );
        });
      } else {
        // Assign service
        console.log(`[DEBUG] Calling API to assign service ${service.id} to client ${client.id}`);
        await new Promise((resolve, reject) => {
          assignService.mutate(
            {
              clientId: client.id,
              serviceId: service.id,
              fechaAsignacion: new Date(),
              notas: ''
            },
            {
              onSuccess: (result) => {
                console.log(`[DEBUG] Service ${service.id} successfully assigned to client ${client.id}`);
                
                // Invalidate relevant queries
                queryClient.invalidateQueries({ queryKey: ['matrixData'] });
                queryClient.invalidateQueries({ queryKey: ['clientServices', client.id] });
                queryClient.invalidateQueries({ queryKey: ['serviceClients', service.id] });
                
                if (onSuccess) onSuccess(result);
                resolve(result);
              },
              onError: (error) => {
                console.error(`[DEBUG] Error assigning service ${service.id} to client ${client.id}:`, error);
                if (onError) onError(error);
                reject(error);
              }
            }
          );
        });
      }
      
      return true;
    } catch (error) {
      console.error(`[DEBUG] Operation failed for ${operationKey}:`, error);
      return false;
    } finally {
      // Clear pending status
      setPendingOperations(prev => {
        const updated = { ...prev };
        delete updated[operationKey];
        return updated;
      });
    }
  };
  
  return {
    toggleServiceAssignment,
    pendingOperations
  };
};

export default useClientServiceManager; 