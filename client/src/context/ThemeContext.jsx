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
  bg: '#0f1419',
  bgSecondary: '#1a1f2e',
  bgTertiary: '#22283a',
  text: '#e4e7eb',
  textSecondary: '#b8bdc8',
  textMuted: '#8b92a4',
  border: '#2d3548',
  borderLight: '#3d4558',
  primary: '#60a5fa',
  primaryDark: '#3b82f6',
  primaryLight: '#1e3a5f',
  error: '#f87171',
  errorBg: '#7f1d1d'
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme-dark');
    return saved ? JSON.parse(saved) : true;
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
