import React, { createContext, useState, useMemo } from 'react';

export const ThemeContext = createContext();

const lightTheme = {
  bg: '#ffffff',
  bgSecondary: '#fafbfc',
  bgTertiary: '#f7fafc',
  text: '#1a202c',
  textSecondary: '#4a5568',
  textMuted: '#718096',
  border: '#cbd5e0',
  borderLight: '#a0aec0',
  primary: '#3182ce',
  primaryDark: '#2563a8',
  primaryLight: '#edf2f7',
  error: '#fc8181',
  errorBg: '#fed7d7'
};

const darkTheme = {
  bg: '#1a202c',
  bgSecondary: '#2d3748',
  bgTertiary: '#374151',
  text: '#f7fafc',
  textSecondary: '#cbd5e0',
  textMuted: '#a0aec0',
  border: '#4a5568',
  borderLight: '#718096',
  primary: '#4299e1',
  primaryDark: '#3182ce',
  primaryLight: '#2c5282',
  error: '#fc8181',
  errorBg: '#742a2a'
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme-dark');
    return saved ? JSON.parse(saved) : false;
  });

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newValue = !prev;
      localStorage.setItem('theme-dark', JSON.stringify(newValue));
      return newValue;
    });
  };

  const value = useMemo(() => ({ theme, isDark, toggleTheme }), [theme, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
