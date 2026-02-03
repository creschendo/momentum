import React, { useState } from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import WaterTracker from './WaterTracker';
import FoodLogger from './FoodLogger';
import BMRCalculator from './BMRCalculator';
import { useTheme } from '../../context/ThemeContext';

export default function NutritionModule() {
  const { theme } = useTheme();
  const [expandedSection, setExpandedSection] = useState('water');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSection = (title, section, component) => (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => toggleSection(section)}
        style={{
          width: '100%',
          padding: '16px 20px',
          backgroundColor: expandedSection === section ? theme.primary : theme.bgTertiary,
          color: expandedSection === section ? 'white' : theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 200ms',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
          boxSizing: 'border-box'
        }}
        onMouseEnter={(e) => {
          if (expandedSection !== section) {
            e.target.style.backgroundColor = theme.primaryLight;
          }
        }}
        onMouseLeave={(e) => {
          if (expandedSection !== section) {
            e.target.style.backgroundColor = theme.bgTertiary;
          }
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 16 }}>
          {expandedSection === section ? '▼' : '▶'}
        </span>
      </button>
      {expandedSection === section && (
        <div style={{ marginTop: 12, animation: 'slideDown 200ms ease-out', overflow: 'hidden' }}>
          <style>{`
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          <div style={{ boxSizing: 'border-box', overflow: 'hidden' }}>
            {component}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <ModuleContainer moduleKey="nutrition" title="Nutrition" description="Track meals, calories, macros, and nutrition goals." />
      {renderSection('Water Intake', 'water', <WaterTracker />)}
      {renderSection('Food Logger', 'calories', <FoodLogger />)}
      {renderSection('BMR Calculator', 'bmr', <BMRCalculator />)}
    </div>
  );
}
