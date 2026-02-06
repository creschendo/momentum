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

const forestTheme = {
  bg: '#0a0f0d',
  bgSecondary: '#152820',
  bgTertiary: '#1f3a2f',
  text: '#e8f2ed',
  textSecondary: '#b8d4c8',
  textMuted: '#7a9d8f',
  border: '#2d4a3e',
  borderLight: '#3d5a4e',
  primary: '#4ade80',
  primaryDark: '#22c55e',
  primaryLight: '#1e4a2f',
  error: '#fb7185',
  errorBg: '#881337'
};

const emberTheme = {
  bg: '#1a0a0a',
  bgSecondary: '#2d1515',
  bgTertiary: '#3d1f1f',
  text: '#f2dfdf',
  textSecondary: '#dab8b8',
  textMuted: '#b87a7a',
  border: '#4d2828',
  borderLight: '#5d3333',
  primary: '#ff4433',
  primaryDark: '#e63946',
  primaryLight: '#4d1a1a',
  error: '#f87171',
  errorBg: '#7f1d1d'
};

const themes = {
  light: lightTheme,
  dark: darkTheme,
  forest: forestTheme,
  ember: emberTheme
};

export const themeNames = {
  light: 'Light',
  dark: 'Dark',
  forest: 'Forest',
  ember: 'Ember'
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('current-theme');
    return saved && themes[saved] ? saved : 'dark';
  });

  const theme = themes[currentTheme];
  const isDark = currentTheme !== 'light';

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('current-theme', themeName);
    }
  };

  const value = useMemo(() => ({ theme, currentTheme, isDark, setTheme }), [theme, currentTheme, isDark]);

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
