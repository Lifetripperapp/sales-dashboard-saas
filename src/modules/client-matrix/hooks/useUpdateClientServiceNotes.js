import { useMutation } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Hook for updating the notes of an existing client-service relationship
 * @returns {Object} Object containing mutation functions
 */
const useUpdateClientServiceNotes = () => {
  // Update client service notes mutation
  const updateNotes = useMutation({
    mutationFn: async ({ clientServiceId, notes }) => {
      console.log(`Updating notes for client-service with ID: ${clientServiceId}`);
      
      const data = await authFetch(buildApiUrl(`/api/cliente-servicios/${clientServiceId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notas: notes }),
      });
      
      return data;
    },
  });
  
  return {
    updateNotes,
  };
};

export default useUpdateClientServiceNotes; 