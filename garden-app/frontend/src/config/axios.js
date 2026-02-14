import axios from 'axios';

// Configure axios defaults
// Use empty string for relative URLs (works with nginx proxy)
const API_URL = process.env.REACT_APP_API_URL || '';
const isDev = process.env.NODE_ENV === 'development';

axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
// CSRF Protection - custom header required by backend
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// CRITICAL FIX: Set timeout to prevent infinite hanging requests
axios.defaults.timeout = 10000; // 10 seconds

// API URL configured: development mode uses relative URLs by default

// Request interceptor: add auth token only to same-origin API requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      const requestUrl = config.url || '';
      const isRelative = !requestUrl.startsWith('http');
      const isSameOrigin = API_URL && requestUrl.startsWith(API_URL);
      if (isRelative || isSameOrigin) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log detailed errors in development
    if (isDev) {
      console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'No response'}`);
    }
    return Promise.reject(error);
  }
);

/**
 * Buduje poprawny URL do zdjęcia z bazy danych.
 * Obsługuje różne formaty ścieżek:
 *   "uploads/tomato.jpg"       -> "/uploads/tomato.jpg"
 *   "/uploads/tomato.jpg"      -> "/uploads/tomato.jpg"
 *   "thumbs/tomato_thumb.jpg"  -> "/uploads/thumbs/tomato_thumb.jpg"
 *   null/undefined             -> null
 */
const getImageUrl = (path) => {
  if (!path) return null;

  // Już jest pełnym URL-em
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Znormalizuj ścieżkę
  let normalized = path;

  // Dodaj leading slash jeśli brak
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  // Upewnij się, że zaczyna się od /uploads/
  if (!normalized.startsWith('/uploads/')) {
    normalized = '/uploads' + normalized;
  }

  return `${API_URL}${normalized}`;
};

export default axios;
export { API_URL, getImageUrl };
