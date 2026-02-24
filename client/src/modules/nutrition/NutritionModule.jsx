import React, { useState } from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import WaterTracker from './WaterTracker';
import WeightTracker from './WeightTracker';
import FoodLogger from './FoodLogger';
import BMRCalculator from './BMRCalculator';
import { useTheme } from '../../context/ThemeContext';
import { CalorieGoalProvider } from './context/CalorieGoalContext';

const TAB_ACCENT = '#3ecf8e';
const TAB_ACCENT_GLOW = '0 0 0 2px rgba(62, 207, 142, 0.35)';

export default function NutritionModule() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('food');

  const tabs = [
    { key: 'food', label: 'Food Logger' },
    { key: 'water', label: 'Water Intake' },
    { key: 'weight', label: 'Weight Tracker' },
    { key: 'bmr', label: 'BMR Calculator' }
  ];

  const renderTabContent = () => {
    if (activeTab === 'water') return <WaterTracker />;
    if (activeTab === 'weight') return <WeightTracker />;
    if (activeTab === 'food') return <FoodLogger />;
    return <BMRCalculator />;
  };

  return (
    <CalorieGoalProvider>
      <div>
        <ModuleContainer moduleKey="nutrition" title="Nutrition" description="Track meals, calories, macros, and nutrition goals." />
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 12,
              flexWrap: 'wrap'
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = TAB_ACCENT;
                    e.currentTarget.style.boxShadow = TAB_ACCENT_GLOW;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isActive ? TAB_ACCENT : theme.border;
                    e.currentTarget.style.boxShadow = isActive ? TAB_ACCENT_GLOW : 'none';
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: `1px solid ${isActive ? TAB_ACCENT : theme.border}`,
                    backgroundColor: isActive ? theme.bgSecondary : theme.bg,
                    color: theme.text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: isActive ? TAB_ACCENT_GLOW : 'none',
                    transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              padding: 8,
              backgroundColor: theme.bgSecondary
            }}
          >
            {renderTabContent()}
          </div>
        </div>
      </div>
    </CalorieGoalProvider>
  );
}
