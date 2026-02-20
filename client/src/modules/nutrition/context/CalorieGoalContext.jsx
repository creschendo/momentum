import React, { createContext, useContext, useState, useEffect } from 'react';

const CalorieGoalContext = createContext();

export function CalorieGoalProvider({ children }) {
  const [calorieGoal, setCalorieGoal] = useState(() => {
    const saved = localStorage.getItem('calorieGoal');
    return saved ? JSON.parse(saved) : null;
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

export function useCalorieGoal() {
  const context = useContext(CalorieGoalContext);
  if (!context) {
    throw new Error('useCalorieGoal must be used within CalorieGoalProvider');
  }
  return context;
}
