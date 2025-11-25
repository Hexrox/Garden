import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../config/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fallback timeout to prevent infinite loading (max 3 seconds)
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('⚠️  AUTH LOADING TIMEOUT');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Problem: Autentykacja nie zakończyła się w ciągu 3 sekund');
        console.error('');
        console.error('Możliwe przyczyny:');
        console.error('1. Backend nie odpowiada (sprawdź Network tab)');
        console.error('2. CORS blokuje requesty (sprawdź błędy w Console)');
        console.error('3. Brak połączenia z API');
        console.error('');
        console.error('Sprawdź:');
        console.error('- Network tab (F12) → filtr "XHR"');
        console.error('- Console tab → szukaj błędów CORS');
        console.error('- Backend: czy pm2 status pokazuje "online"?');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        setLoading(false);
      }
    }, 3000);

    if (token) {
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Get user data from token (decode JWT payload)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.id,
          username: payload.username,
          email: payload.email
        });
      } catch (error) {
        console.error('Invalid token:', error);
        clearTimeout(fallbackTimeout);
        logout();
        return; // Exit early, don't set loading to false yet (logout will trigger re-render)
      }

      // Setup axios interceptor for 401 errors
      const interceptor = axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            console.log('Token expired or invalid, logging out...');
            logout();
          }
          return Promise.reject(error);
        }
      );

      setLoading(false);
      clearTimeout(fallbackTimeout);

      // Cleanup interceptor on unmount or token change
      return () => {
        axios.interceptors.response.eject(interceptor);
        clearTimeout(fallbackTimeout);
      };
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
      clearTimeout(fallbackTimeout);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Błąd logowania'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password
      });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { success: true };
    } catch (error) {
      // Handle validation errors array
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        return {
          success: false,
          error: errorMessages
        };
      }

      return {
        success: false,
        error: error.response?.data?.error || 'Błąd rejestracji'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
