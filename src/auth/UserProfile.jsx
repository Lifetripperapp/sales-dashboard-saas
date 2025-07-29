import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LogoutButton from './LogoutButton';

const UserProfile = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading 
  } = useAuth0();
  const [showDropdown, setShowDropdown] = useState(false);

  if (isLoading) {
    return (
      <div className="p-3">
        <div className="animate-pulse flex space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 p-3 w-full text-left hover:bg-gray-50 rounded-md transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-[#F58220] flex items-center justify-center text-white font-bold">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#4A453F] truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user?.email || ''}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-md shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm font-medium text-[#4A453F]">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="p-2">
            <LogoutButton className="w-full justify-center">
              Sign Out
            </LogoutButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 