import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import ThemeDropdown from './ThemeDropdown';

export default function DashboardHeader({ formattedDateTime, onLogout, sectionMotionProps }) {
  const { theme, currentTheme, isDark } = useTheme();
  const coveAccentWhite = '#ffffff';

  return (
    <motion.header
      style={{ backgroundColor: theme.bgSecondary, borderBottom: `1px solid ${theme.border}`, borderRadius: 12 }}
      {...sectionMotionProps}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 20px', gap: 12 }}>
        <div style={{ justifySelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <div style={{ backgroundColor: theme.bgSecondary, padding: '16px', borderRadius: '8px' }}>
              <svg width="80" height="80" viewBox="0 0 200 200" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                {currentTheme === 'light' ? (
                  <>
                    <rect x="40" y="40" width="120" height="120" fill="#0066FF" />
                    <path d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z" fill="white" />
                  </>
                ) : currentTheme === 'cove' ? (
                  <>
                    <rect x="40" y="40" width="120" height="120" rx="24" fill="#1a1a1a" />
                    <path d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z" fill="white" />
                    <rect x="40" y="40" width="120" height="8" rx="24" fill={coveAccentWhite} />
                  </>
                ) : currentTheme === 'glade' ? (
                  <>
                    <rect x="40" y="40" width="120" height="120" rx="24" fill="#0a1f0f" />
                    <path d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z" fill="white" />
                    <rect x="40" y="40" width="120" height="8" rx="24" fill="#4ade80" />
                  </>
                ) : currentTheme === 'supabase' ? (
                  <>
                    <rect x="40" y="40" width="120" height="120" rx="24" fill="#0b0f0c" />
                    <path d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z" fill="white" />
                    <rect x="40" y="40" width="120" height="8" rx="24" fill="#3ecf8e" />
                  </>
                ) : (
                  <>
                    <rect x="40" y="40" width="120" height="120" rx="24" fill="#1a1a1a" />
                    <path d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z" fill="white" />
                  </>
                )}
              </svg>
            </div>
          </div>
        </div>

        <div
          style={{
            justifySelf: 'center',
            fontSize: 30,
            fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
            fontWeight: 500,
            color: theme.text,
            letterSpacing: '0.05px',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
          aria-live="polite"
        >
          {formattedDateTime}
        </div>

        <div style={{ justifySelf: 'end', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={onLogout}
            style={{
              padding: '10px 15px 10px 15px',
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
              minWidth: '50px',
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
            Logout
          </button>
          <ThemeDropdown />
        </div>
      </div>
    </motion.header>
  );
}
