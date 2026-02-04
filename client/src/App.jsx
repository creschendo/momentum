import React from 'react';
import './index.css';
import ModuleCard from './components/ModuleCard';
import ModuleContainer from './components/ModuleContainer';
import nutrition from './modules/nutrition';
import fitness from './modules/fitness';
import productivity from './modules/productivity';
import NutritionModule from './modules/nutrition/NutritionModule';
import FitnessModule from './modules/fitness/FitnessModule';
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <svg width="50" height="50" viewBox="0 0 200 200" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
                <rect x="40" y="40" width="120" height="120" fill="#0066FF" />
                <path
                  d="M55 145 L55 65 L80 90 L100 70 L120 90 L145 65 L145 145 L125 145 L125 95 L100 120 L75 95 L75 145 Z"
                  fill="white"
                />
              </svg>
              <h1 style={{ margin: 3, marginTop: 8, marginBottom: 12, color: theme.text }}>Momentum</h1>
            </div>
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
            ) : m.key === 'fitness' ? (
              <div key={m.key} className="module-card">
                <FitnessModule />
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
