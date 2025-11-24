import axios from 'axios';

// Configure axios defaults
// Use empty string for relative URLs (works with nginx proxy)
const API_URL = process.env.REACT_APP_API_URL || '';

axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Log API configuration on startup
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🌱 Garden App Frontend');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`API URL: ${API_URL || '(relative URLs - requires nginx proxy)'}`);
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
    // Log all API errors (helps diagnose production issues)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ API Error');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`URL: ${error.config?.url}`);
    console.error(`Method: ${error.config?.method?.toUpperCase()}`);
    console.error(`Status: ${error.response?.status || 'No response'}`);
    console.error(`Message: ${error.response?.data?.error || error.message}`);

    // Additional help for common errors
    if (!error.response) {
      console.error('');
      console.error('⚠️  Backend nie odpowiada!');
      console.error('Możliwe przyczyny:');
      console.error('1. Backend nie działa (sprawdź: pm2 status)');
      console.error('2. Nginx nie przekierowuje /api (sprawdź nginx config)');
      console.error('3. Firewall blokuje port');
    } else if (error.response.status === 401) {
      console.error('');
      console.error('⚠️  Nieautoryzowany - token wygasł lub jest nieprawidłowy');
    } else if (error.response.status === 403) {
      console.error('');
      console.error('⚠️  Brak uprawnień');
    } else if (error.message.includes('CORS')) {
      console.error('');
      console.error('⚠️  CORS Error!');
      console.error('Backend musi mieć FRONTEND_URL ustawiony na domenę produkcyjną');
      console.error('Sprawdź: /var/www/garden/backend/.env');
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return Promise.reject(error);
  }
);

export default axios;
export { API_URL };
