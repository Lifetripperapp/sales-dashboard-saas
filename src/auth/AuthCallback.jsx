import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const AuthCallback = () => {
  const { 
    error, 
    isLoading 
  } = useAuth0();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-700 mb-4">{error.message}</p>
          <a 
            href="/" 
            className="bg-[#F58220] text-white px-4 py-2 rounded-md hover:bg-[#e67812] transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent mb-4"></div>
          <p className="text-lg text-[#4A453F]">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback; 