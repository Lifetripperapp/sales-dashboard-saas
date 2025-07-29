import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LogoutButton = ({ className = '', children = 'Log Out' }) => {
  const { logout: auth0Logout } = useAuth0();

  const handleLogout = () => {
    auth0Logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    });
  };

  return (
    <button 
      onClick={handleLogout}
      className={`px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

export default LogoutButton; 