import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CalorieGoal } from '../../../types/modules';

interface CalorieGoalContextValue {
  calorieGoal: CalorieGoal | null;
  setCalorieGoal: React.Dispatch<React.SetStateAction<CalorieGoal | null>>;
}

const CalorieGoalContext = createContext<CalorieGoalContextValue | undefined>(undefined);

export function CalorieGoalProvider({ children }: { children: ReactNode }) {
  const [calorieGoal, setCalorieGoal] = useState<CalorieGoal | null>(() => {
    const saved = localStorage.getItem('calorieGoal');
    return saved ? (JSON.parse(saved) as CalorieGoal) : null;
  });

  useEffect(() => {
    if (calorieGoal) {
      localStorage.setItem('calorieGoal', JSON.stringify(calorieGoal));
    }
  }, [calorieGoal]);

  return (
    <CalorieGoalContext.Provider value={{ calorieGoal, setCalorieGoal }}>
      {children}
    </CalorieGoalContext.Provider>
  );
}

export function useCalorieGoal(): CalorieGoalContextValue {
  const context = useContext(CalorieGoalContext);
  if (!context) {
    throw new Error('useCalorieGoal must be used within CalorieGoalProvider');
  }
  return context;
}
