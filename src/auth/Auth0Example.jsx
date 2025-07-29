import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * Example component demonstrating Auth0 hook usage
 * This component shows the standard Auth0 pattern and can be used as a reference
 */
const Auth0Example = () => {
  const {
    isLoading, // Loading state, the SDK needs to reach Auth0 on load
    isAuthenticated,
    error,
    loginWithRedirect: login, // Starts the login flow
    logout: auth0Logout, // Starts the logout flow
    user, // User profile
  } = useAuth0();

  const signup = () =>
    login({ authorizationParams: { screen_hint: 'signup' } });

  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  if (isLoading) return <div>Loading...</div>;

  return isAuthenticated ? (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <p className="mb-4">Logged in as {user.email}</p>

      <h1 className="text-2xl font-bold mb-4">User Profile</h1>

      <pre className="bg-gray-100 p-4 rounded mb-4 overflow-auto">
        {JSON.stringify(user, null, 2)}
      </pre>

      <button 
        onClick={logout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        Logout
      </button>
    </div>
  ) : (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error.message}
        </div>
      )}

      <div className="space-x-4">
        <button 
          onClick={signup}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Signup
        </button>

        <button 
          onClick={login}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Auth0Example; 