import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { initializeAuthFetch } from '../common/utils/fetch-wrapper';

/**
 * AuthInitializer component that sets up authenticated fetch
 * This component should be rendered early in the app lifecycle
 */
const AuthInitializer = ({ children }) => {
  const { 
    getAccessTokenSilently,
    isLoading,
    isAuthenticated
  } = useAuth0();

  useEffect(() => {
    // Initialize auth fetch as soon as we have the function, even if not authenticated yet
    // This allows the function to be available for when authentication completes
    if (getAccessTokenSilently) {
      initializeAuthFetch(getAccessTokenSilently);
    }
  }, [getAccessTokenSilently]);

  return children;
};

export default AuthInitializer; 