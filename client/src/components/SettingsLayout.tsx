import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TABS = [
  { key: 'profile', label: 'Profile', path: '/profile' },
  { key: 'account', label: 'Account', path: '/account' },
  { key: 'security', label: 'Security', path: '/security' }
];

export default function SettingsLayout({ current, children }: { current: string; children: React.ReactNode }) {
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();

  const backBtn: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: theme.bgTertiary,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <button type="button" onClick={() => navigate('/')} style={backBtn}>
          ← Dashboard
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {TABS.map((tab) => {
          const active = current === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => navigate(tab.path)}
              style={{
                padding: '7px 16px',
                borderRadius: 7,
                border: `1px solid ${active ? theme.primary : theme.border}`,
                backgroundColor: active ? `${theme.primary}22` : theme.bgTertiary,
                color: active ? theme.primary : theme.textSecondary,
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: active ? `0 0 0 1px ${theme.primary}44` : 'none'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: 520 }}>{children}</div>
    </div>
  );
}
