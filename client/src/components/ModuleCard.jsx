import React from 'react';
import { useTheme } from '../context/ThemeContext';

// Presentational component: receives `status` from parent (no side-effects here)
export default function ModuleCard({ title, description, status }) {
  const { theme, currentTheme } = useTheme();
  const titleAccentColor = currentTheme === 'cove' ? '#fb923c' : theme.primary;

  return (
    <div className="module-title-card" style={{ padding: '16px 20px' }}>
      <div
        style={{
          height: 2,
          width: 36,
          borderRadius: 999,
          backgroundColor: titleAccentColor,
          marginBottom: 10
        }}
      />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 650, color: theme.text, lineHeight: 1.2 }}>{title}</h2>
      <p style={{ margin: '6px 0 0 0', fontSize: 13, color: theme.textMuted, lineHeight: 1.45 }}>{description}</p>
    </div>
  );
}
