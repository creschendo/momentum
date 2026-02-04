import React, { useState } from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import WaterTracker from './WaterTracker';
import FoodLogger from './FoodLogger';
import BMRCalculator from './BMRCalculator';
import { useTheme } from '../../context/ThemeContext';

export default function NutritionModule() {
  const { theme } = useTheme();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSection = (title, section, component) => (
    <div style={{ 
      marginBottom: 12, 
      border: `1.5px solid ${expandedSection === section ? '#0066FF' : theme.border}`,
      borderRadius: 8,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      backgroundColor: theme.bgSecondary
    }}>
      <button
        onClick={() => toggleSection(section)}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: expandedSection === section ? 'transparent' : theme.bgSecondary,
          color: expandedSection === section ? theme.textMuted : theme.text,
          border: 'none',
          borderRadius: 0,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background-color 0.2s, color 0.2s',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
          boxSizing: 'border-box'
        }}
        onMouseEnter={(e) => {
          if (expandedSection !== section) {
            e.target.style.backgroundColor = theme.bg;
          }
        }}
        onMouseLeave={(e) => {
          if (expandedSection !== section) {
            e.target.style.backgroundColor = theme.bgSecondary;
          }
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 14, color: theme.textMuted }}>
          {expandedSection === section ? '▼' : '▶'}
        </span>
      </button>
      {expandedSection === section && (
        <div style={{ marginTop: 0, animation: 'slideDown 200ms ease-out', overflow: 'hidden' }}>
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
      <div style={{ marginTop: 24 }}>
        {renderSection('Water Intake', 'water', <WaterTracker />)}
        {renderSection('Food Logger', 'calories', <FoodLogger />)}
        {renderSection('BMR Calculator', 'bmr', <BMRCalculator />)}
      </div>
    </div>
  );
}
