/**
 * Fetch wrapper utility that handles errors and timeouts consistently
 */
import { buildApiUrl } from './apiConfig';

// Auth0 integration variables
let getAccessTokenFunction = null;

/**
 * Initialize the auth fetch with the Auth0 getAccessTokenSilently function
 * This should be called from a component that has access to useAuth0
 */
export const initializeAuthFetch = (getAccessTokenSilently) => {
  getAccessTokenFunction = getAccessTokenSilently;
};

/**
 * Authenticated fetch function that includes JWT token in Authorization header
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} - The fetch promise with parsed JSON data
 */
export const authFetch = async (url, options = {}, timeoutMs = 15000) => {
  if (!getAccessTokenFunction) {
    console.error('Auth fetch not initialized. Call initializeAuthFetch first.');
    throw new Error('Authentication not initialized');
  }

  try {
    // Get the access token from Auth0
    const accessToken = await getAccessTokenFunction({
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: 'openid profile email'
    });
    
    // Add the Authorization header with the JWT token
    const authenticatedOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      }
    };

    // Build the full URL if it's a relative API path
    const fullUrl = url.startsWith('/api/') ? buildApiUrl(url) : url;

    // Use the existing fetch wrapper with authentication
    return await fetchWithTimeout(fullUrl, authenticatedOptions, timeoutMs);
  } catch (error) {
    console.error('Auth fetch error:', error);
    throw error;
  }
};

/**
 * Enhanced fetch function with timeout and better error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} - The fetch promise
 */
export const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
  console.log(`Fetching: ${url}`);
  
  // Create an abort controller to handle timeouts
  const controller = new AbortController();
  const { signal } = controller;
  
  // Set timeout to abort the request if it takes too long
  const timeout = setTimeout(() => {
    controller.abort();
    console.error(`Request timeout for ${url}`);
  }, timeoutMs);
  
  try {
    // Make the request with the abort signal
    const response = await fetch(url, {
      ...options,
      signal,
      // Enforce JSON content type for API requests and prevent caching
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(options.headers || {})
      }
    });
    
    // Clear the timeout since the request completed
    clearTimeout(timeout);
    console.log(`Fetch response for ${url}: Status ${response.status}`);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API error (${response.status}) for ${url}:`, errorData);
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    // Parse and return JSON data
    const data = await response.json();
    console.log(`Successfully fetched data from ${url}`);
    return data;
  } catch (error) {
    // Clear the timeout in case of error
    clearTimeout(timeout);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      console.error(`Request aborted for ${url}: Timeout of ${timeoutMs}ms exceeded`);
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

/**
 * API fetch function that combines buildApiUrl with fetchWithTimeout
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} - The fetch promise
 */
export const apiFetch = (endpoint, options = {}, timeoutMs = 15000) => {
  const url = buildApiUrl(endpoint);
  return fetchWithTimeout(url, options, timeoutMs);
};

// Export convenience methods for common HTTP methods
export const apiGet = (endpoint, options = {}, timeoutMs = 15000) => {
  console.log(`[apiGet] Requesting ${endpoint}`);
  return apiFetch(endpoint, { ...options, method: 'GET' }, timeoutMs)
    .then(response => {
      // Additional logging for debugging API responses
      if (!response.success && response.data?.rows?.length === 0) {
        console.warn(`[apiGet] Empty results returned from ${endpoint}:`, response);
      } else if (response.success) {
        console.log(`[apiGet] Success from ${endpoint}: Received ${response.data?.rows?.length || 0} items`);
      }
      return response;
    })
    .catch(error => {
      console.error(`[apiGet] Error in request to ${endpoint}:`, error);
      throw error;
    });
};

export const apiPost = (endpoint, data, options = {}, timeoutMs = 15000) => {
  return apiFetch(
    endpoint, 
    { 
      ...options, 
      method: 'POST',
      body: JSON.stringify(data)
    }, 
    timeoutMs
  );
};

export const apiPut = (endpoint, data, options = {}, timeoutMs = 15000) => {
  return apiFetch(
    endpoint, 
    { 
      ...options, 
      method: 'PUT',
      body: JSON.stringify(data)
    }, 
    timeoutMs
  );
};

export const apiDelete = (endpoint, options = {}, timeoutMs = 15000) => {
  return apiFetch(endpoint, { ...options, method: 'DELETE' }, timeoutMs);
}; 