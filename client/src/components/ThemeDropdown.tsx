import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { popoverTransition } from '../motion/presets';
import { getThemeIcon } from '../utils/moduleHelpers';

export default function ThemeDropdown() {
  const { theme, currentTheme, isDark, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Select theme"
        style={{
          padding: '10px 36px 10px 36px',
          backgroundColor: theme.bgTertiary,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 200ms ease',
          fontFamily: 'inherit',
          boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`,
          minWidth: '140px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.bgSecondary;
          e.currentTarget.style.borderColor = theme.borderLight;
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = `0 4px 12px rgba(0, 0, 0, ${isDark ? '0.4' : '0.15'})`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.bgTertiary;
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`;
        }}
      >
        {getThemeIcon(currentTheme, theme.textMuted)}
        <span style={{ flex: 1, textAlign: 'left' }}>
          {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.textMuted}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease'
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={popoverTransition}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999
              }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={popoverTransition}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: '140px',
                backgroundColor: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                boxShadow: `0 8px 24px rgba(0, 0, 0, ${isDark ? '0.5' : '0.15'}), 0 2px 8px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'})`,
                zIndex: 1000,
                overflow: 'hidden',
                padding: '6px'
              }}
            >
              {['night', 'cove'].map((themeName, index, arr) => (
                <button
                  key={themeName}
                  onClick={() => {
                    setTheme(themeName);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: currentTheme === themeName ? theme.bgTertiary : 'transparent',
                    color: theme.text,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: currentTheme === themeName ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: index === arr.length - 1 ? 0 : '2px'
                  }}
                  onMouseEnter={(e) => {
                    if (currentTheme !== themeName) {
                      e.currentTarget.style.backgroundColor = theme.bgTertiary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme !== themeName) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {getThemeIcon(themeName, theme.text)}
                  <span>{themeName.charAt(0).toUpperCase() + themeName.slice(1)}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
