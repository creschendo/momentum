import React from 'react';
import './index.css';
import ModuleCard from './components/ModuleCard';
import ModuleContainer from './components/ModuleContainer';
import nutrition from './modules/nutrition';
import fitness from './modules/fitness';
import productivity from './modules/productivity';
import NutritionModule from './modules/nutrition/NutritionModule';
import ProductivityModule from './modules/productivity/ProductivityModule';

const MODULES = [nutrition, fitness, productivity];

export default function App() {
  return (
    <div className="app-root">
      <header>
        <h1>Momentum</h1>
        <p className="muted">Modular productivity: add modules for features like nutrition, fitness, tasks.</p>
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

      <footer className="muted">Add more modules under <code>client/src/modules</code> and corresponding server routes under <code>server/modules</code>.</footer>
    </div>
  );
}
