import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildApiUrl } from '../../../common/utils/apiConfig';
import { authFetch } from '../../../common/utils/fetch-wrapper';

/**
 * Custom hook to create a new client
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (clientData) => {
      console.log('Creating client with data:', clientData);
      
      // Normalize data to match expected schema before sending
      const normalizedData = {
        nombre: clientData.nombre,
        vendedorId: clientData.vendedorId || null,
        tecnicoId: clientData.tecnicoId || null,
        email: clientData.email || '',
        telefono: clientData.telefono || '',
        direccion: clientData.direccion || '',
        contratoSoporte: Boolean(clientData.contratoSoporte),
        fechaUltimoRelevamiento: clientData.fechaUltimoRelevamiento || null,
        linkDocumentoRelevamiento: clientData.linkDocumentoRelevamiento || '',
        notas: clientData.notas || ''
      };
      
      try {
        console.log('Sending normalized data to API:', normalizedData);
        const data = await authFetch(buildApiUrl('/api/clientes'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(normalizedData),
        });
        
        console.log('Client created successfully:', data.data.id);
        return data.data;
      } catch (error) {
        console.error('Client creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate clients query to refetch data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

/**
 * Custom hook to update an existing client
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...clientData }) => {
      if (!id) {
        throw new Error('Cannot update client: Missing client ID');
      }
      
      console.log(`Updating client ${id} with data:`, clientData);
      
      try {
        // Normalize data to match expected schema before sending
        const normalizedData = {
          nombre: clientData.nombre,
          vendedorId: clientData.vendedorId || null,
          tecnicoId: clientData.tecnicoId || null,
          email: clientData.email || '',
          telefono: clientData.telefono || '',
          direccion: clientData.direccion || '',
          contratoSoporte: Boolean(clientData.contratoSoporte),
          fechaUltimoRelevamiento: clientData.fechaUltimoRelevamiento || null,
          linkDocumentoRelevamiento: clientData.linkDocumentoRelevamiento || '',
          notas: clientData.notas || ''
        };
      
      const data = await authFetch(buildApiUrl(`/api/clientes/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedData),
      });
        
      console.log('Client updated successfully:', data.data.id);
      return data.data;
      } catch (error) {
        console.error('Client update error:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate specific client and clients list
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

/**
 * Custom hook to delete a client
 * @returns {Object} Mutation result with mutate function, loading state, and error
 */
const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      console.log(`Deleting client ${id}`);
      
      const data = await authFetch(buildApiUrl(`/api/clientes/${id}`), {
        method: 'DELETE',
      });
      
      console.log('Client deleted successfully:', id);
      return data;
    },
    onSuccess: () => {
      // Invalidate clients query to refetch data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      // Also invalidate matrix data as client deletion affects it
      queryClient.invalidateQueries({ queryKey: ['matrixData'] });
    },
  });
};

/**
 * Combined hook for all client CRUD operations
 * @returns {Object} Object containing all client CRUD mutation hooks
 */
const useSaveClient = () => {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  
  return {
    createClient,
    updateClient,
    deleteClient,
  };
};

export default useSaveClient; 