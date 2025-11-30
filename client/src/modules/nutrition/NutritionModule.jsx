import React from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import WaterTracker from './WaterTracker';

export default function NutritionModule() {
  return (
    <div>
      <ModuleContainer moduleKey="nutrition" title="Nutrition" description="Track meals, calories, macros, and nutrition goals." />
      <WaterTracker />
    </div>
  );
}
