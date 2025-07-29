import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './LoginButton';

const ProtectedRoute = ({ children }) => {
  const {
    isLoading,
    isAuthenticated,
    error,
  } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#F58220] border-r-transparent mb-4"></div>
          <p className="text-lg text-[#4A453F]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if this is an email verification error
    const isEmailVerificationError = error.message && (
      error.message.includes('verify your email') ||
      error.message.includes('EMAIL_VERIFICATION_REQUIRED') ||
      error.message.includes('Check your inbox')
    );

    if (isEmailVerificationError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.12a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#4A453F] mb-4">Check Your Email</h1>
            <p className="text-gray-600 mb-6">
              We've sent a verification email to your inbox. Please click the verification link to complete your registration and access the Sales Dashboard.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                <strong>Next steps:</strong><br/>
                1. Check your email inbox<br/>
                2. Click the verification link<br/>
                3. Return here and log in
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <LoginButton className="px-6 py-2">
                Try Logging In
              </LoginButton>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Refresh Page
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      );
    }

    // Handle other authentication errors
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-700 mb-6">{error.message}</p>
          <LoginButton>Try Again</LoginButton>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <img 
            src="/logo.png" 
            alt="Sales Dashboard Logo" 
            className="h-16 mx-auto mb-6"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h1 className="text-3xl font-bold text-[#4A453F] mb-4">Sales Dashboard</h1>
          <p className="text-gray-600 mb-6">Please log in to access the dashboard</p>
          <div className="flex gap-4 justify-center">
            <LoginButton className="text-lg px-8 py-3">
              Log In
            </LoginButton>
            <LoginButton className="text-lg px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200" isSignup={true}>
              Sign Up
            </LoginButton>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute; 