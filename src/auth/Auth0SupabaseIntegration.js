import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

/**
 * Hook para integrar Auth0 con Supabase
 * Mantiene Auth0 para autenticación pero sincroniza con Supabase
 */
export const useAuth0Supabase = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      syncUserWithSupabase();
    }
  }, [isAuthenticated, user]);

  /**
   * Sincroniza usuario de Auth0 con Supabase
   */
  const syncUserWithSupabase = async () => {
    try {
      const token = await getAccessTokenSilently();
      
      // Buscar o crear usuario en Supabase
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          auth0UserId: user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSupabaseUser(data.user);
        setTenant(data.tenant);
      }
    } catch (error) {
      console.error('Error syncing user with Supabase:', error);
    }
  };

  /**
   * Obtener información del tenant actual
   */
  const getCurrentTenant = async () => {
    try {
      const token = await getAccessTokenSilently();
      
      const response = await fetch('/api/tenants/current', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting current tenant:', error);
      return null;
    }
  };

  /**
   * Crear nuevo tenant
   */
  const createTenant = async (tenantData) => {
    try {
      const token = await getAccessTokenSilently();
      
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tenantData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  };

  return {
    // Auth0 state
    user,
    isAuthenticated,
    isLoading,
    
    // Supabase state
    supabaseUser,
    tenant,
    
    // Methods
    syncUserWithSupabase,
    getCurrentTenant,
    createTenant
  };
}; 