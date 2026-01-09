import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

  // Emergency timeout: Force loading to false if stuck for too long
  // This is a safety net in case the main useEffect fails to set loading=false
  useEffect(() => {
    if (loading) {
      const emergencyTimeout = setTimeout(() => {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('🚨 EMERGENCY: Auth loading stuck at true');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Forcing loading to false after 8 seconds');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        setLoading(false);
      }, 8000); // 8 seconds as last resort

      return () => clearTimeout(emergencyTimeout);
    }
  }, [loading]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Fetch full user data from backend (includes email, email_verified, etc.)
      const fetchUserData = async () => {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
          setLoading(false);
          clearTimeout(fallbackTimeout);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // Token is invalid or expired - logout
          setLoading(false);
          clearTimeout(fallbackTimeout);
          logout();
        }
      };

      fetchUserData();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, logout]);

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
