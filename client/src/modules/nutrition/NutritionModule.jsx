import React, { useState } from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import WaterTracker from './WaterTracker';
import WeightTracker from './WeightTracker';
import FoodLogger from './FoodLogger';
import BMRCalculator from './BMRCalculator';
import { useTheme } from '../../context/ThemeContext';
import { CalorieGoalProvider } from './context/CalorieGoalContext';

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
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: `1px solid ${isActive ? theme.primary : theme.border}`,
                    backgroundColor: isActive ? theme.bgSecondary : theme.bg,
                    color: theme.text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background-color 0.2s'
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
