import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from '../config/axios';

const AuthContext = createContext();
const isDev = process.env.NODE_ENV === 'development';

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
  useEffect(() => {
    if (loading) {
      const emergencyTimeout = setTimeout(() => {
        if (isDev) console.error('Auth loading stuck - forcing to false');
        setLoading(false);
      }, 8000);
      return () => clearTimeout(emergencyTimeout);
    }
  }, [loading]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // Token is now managed via request interceptor in axios config
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (token) {
      // Fetch full user data from backend
      axios.get('/api/auth/me', { signal: controller.signal })
        .then(response => {
          setUser(response.data.user);
          setLoading(false);
        })
        .catch(err => {
          if (err.name === 'CanceledError') return;
          // Token is invalid or expired - logout
          setLoading(false);
          logout();
        });

      // Setup axios interceptor for 401 errors
      const interceptor = axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            logout();
          }
          return Promise.reject(error);
        }
      );

      return () => {
        controller.abort();
        axios.interceptors.response.eject(interceptor);
      };
    } else {
      setLoading(false);
    }
  }, [token, logout]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      // Token is now managed via request interceptor in axios config

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

      // Po rejestracji nie logujemy automatycznie - wymagana weryfikacja email
      return { success: true, requiresVerification: true, message: response.data.message };
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
