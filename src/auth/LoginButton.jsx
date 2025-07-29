import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const LoginButton = ({ className = '', children = 'Log In', isSignup = false }) => {
  const { loginWithRedirect: login } = useAuth0();

  const handleLogin = () => {
    login({
      authorizationParams: {
        ...(isSignup && { screen_hint: 'signup' })
      },
      appState: {
        returnTo: window.location.pathname
      }
    });
  };

  return (
    <button 
      onClick={handleLogin}
      className={`bg-[#F58220] text-white px-4 py-2 rounded-md hover:bg-[#e67812] transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

export default LoginButton; 