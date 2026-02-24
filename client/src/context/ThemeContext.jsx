import React, { createContext, useState, useMemo } from 'react';

export const ThemeContext = createContext();

const coveTheme = {
  bg: '#071e2e',
  bgSecondary: '#0d2d40',
  bgTertiary: '#113a52',
  text: '#d6f0f5',
  textSecondary: '#96cfe0',
  textMuted: '#5fa8c0',
  border: '#1a4d65',
  borderLight: '#236280',
  primary: '#38c9d4',
  primaryDark: '#1ba8b4',
  primaryLight: '#0d3d50',
  error: '#f87171',
  errorBg: '#7f1d1d'
};

const gladeTheme = {
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

const nightTheme = {
  bg: '#080808',
  bgSecondary: '#0f0f10',
  bgTertiary: '#151517',
  text: '#f5f5f5',
  textSecondary: '#cfcfcf',
  textMuted: '#9a9a9a',
  border: '#26272a',
  borderLight: '#32343a',
  primary: '#3ecf8e',
  primaryDark: '#2eb67d',
  primaryLight: '#0f2119',
  error: '#f87171',
  errorBg: '#7f1d1d'
};

const themes = {
  cove: coveTheme,
  glade: gladeTheme,
  night: nightTheme
};

export const themeNames = {
  cove: 'Cove',
  glade: 'Glade',
  night: 'Night'
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('current-theme');
    return saved && themes[saved] ? saved : 'night';
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
