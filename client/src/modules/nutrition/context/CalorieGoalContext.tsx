// CalorieGoalContext — shares the user's active calorie goal between FoodLogger and BMRCalculator.
// The goal is persisted to localStorage so it survives page refreshes without a server round-trip.
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CalorieGoal } from '../../../types/modules';

/** Value shape exposed to consumers via useCalorieGoal(). */
interface CalorieGoalContextValue {
  calorieGoal: CalorieGoal | null;
  setCalorieGoal: React.Dispatch<React.SetStateAction<CalorieGoal | null>>;
}

const CalorieGoalContext = createContext<CalorieGoalContextValue | undefined>(undefined);

/**
 * Provides calorieGoal state to the nutrition subtree.
 * Reads the initial value from localStorage and writes back whenever it changes.
 */
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

/** Returns the current calorie goal and its setter. Must be used inside CalorieGoalProvider. */
export function useCalorieGoal(): CalorieGoalContextValue {
  const context = useContext(CalorieGoalContext);
  if (!context) {
    throw new Error('useCalorieGoal must be used within CalorieGoalProvider');
  }
  return context;
}
