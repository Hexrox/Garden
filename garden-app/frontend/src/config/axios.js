import axios from 'axios';

// Configure axios defaults
// Use empty string for relative URLs (works with nginx proxy)
const API_URL = process.env.REACT_APP_API_URL || '';

axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for debugging (can be removed in production)
axios.interceptors.request.use(
  (config) => {
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      });
    }
    return Promise.reject(error);
  }
);

export default axios;
export { API_URL };
