import React from 'react';
import './index.css';
import ModuleCard from './components/ModuleCard';
import ModuleContainer from './components/ModuleContainer';
import nutrition from './modules/nutrition';
import fitness from './modules/fitness';
import productivity from './modules/productivity';
import NutritionModule from './modules/nutrition/NutritionModule';
import ProductivityModule from './modules/productivity/ProductivityModule';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const MODULES = [nutrition, fitness, productivity];

function AppContent() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <div className="app-root" style={{ backgroundColor: theme.bg, color: theme.text, transition: 'all 200ms' }}>
      <header style={{ backgroundColor: theme.bgSecondary, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
          <div>
            <h1 style={{ margin: 0, color: theme.text }}>Momentum</h1>
            <p className="muted" style={{ color: theme.textMuted }}>Modular productivity: add modules for features like nutrition, fitness, tasks.</p>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              padding: '8px 16px',
              backgroundColor: theme.primaryLight,
              color: theme.primary,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms',
              minWidth: 100
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.primary;
              e.target.style.color = theme.bg;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = theme.primaryLight;
              e.target.style.color = theme.primary;
            }}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      <main>
        <div className="module-grid">
          {MODULES.map((m) => (
            m.key === 'nutrition' ? (
              <div key={m.key} className="module-card">
                <NutritionModule />
              </div>
            ) : m.key === 'productivity' ? (
              <div key={m.key} className="module-card">
                <ProductivityModule />
              </div>
            ) : (
              <ModuleContainer
                key={m.key}
                moduleKey={m.key}
                title={m.title}
                description={m.description}
              />
            )
          ))}
        </div>
      </main>

      <footer className="muted" style={{ color: theme.textMuted, borderTop: `1px solid ${theme.border}` }}>Add more modules under <code>client/src/modules</code> and corresponding server routes under <code>server/modules</code>.</footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
