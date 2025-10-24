import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage first
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      const isDark = savedMode === 'true';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    }
    setLoading(false);
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());

    // Update DOM
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to backend
    try {
      await axios.put('/api/auth/dark-mode', { dark_mode: newMode });
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};
