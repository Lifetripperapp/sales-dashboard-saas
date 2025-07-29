/**
 * UYTECH Sales Dashboard - API Configuration
 * Central configuration for API endpoints
 */

// Determine the base URL for API calls based on environment
const getApiBaseUrl = () => {
  // In production (Heroku), use relative URLs
  if (process.env.NODE_ENV === 'production') {
    console.log('API Config: Using relative URL for production');
    return '';  // Use relative URL in production
  }
  
  // In development, use localhost
  console.log('API Config: Using http://localhost:3000 for development');
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();
console.log('Configured API_BASE_URL:', API_BASE_URL);

// Helper function to build API endpoints
export const buildApiUrl = (endpoint) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Building API URL: ${url}`);
  return url;
}; 