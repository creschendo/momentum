// useFoods — hook managing food search, meal composition, meal CRUD, and macro summaries for FoodLogger.
import { useEffect, useState, useCallback } from 'react';
import { searchFoods, postMeal, getFoodSummary, getMeals, updateMeal, deleteMeal, type FoodEntry } from '../../../api/nutrition';
import type { FoodsState, Meal } from '../../../types/modules';

/** Extracts a string error message from any thrown value. */
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Provides food logger state and actions.
 *
 * Meal composition flow:
 *   1. `search(query)` → populates `searchResults`
 *   2. `addFoodToCurrentMeal(food)` → stages items in `currentMeal`
 *   3. `saveMeal(name)` → persists or updates the meal, then clears the staging area
 *
 * Editing an existing meal: call `startEditingMeal(meal)` to pre-populate the staging area,
 * then `saveMeal(name)` to save via PATCH instead of POST.
 */
export default function useFoods() {
  const [searchResults, setSearchResults] = useState<FoodsState['searchResults']>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentMeal, setCurrentMeal] = useState<FoodEntry[]>([]);
  const [mealName, setMealName] = useState<string>('');
  const [editingMealId, setEditingMealId] = useState<number | string | null>(null);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [period, setPeriod] = useState<FoodsState['period']>('daily');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string): Promise<void> => {
    if (!query || query.trim().length === 0) {
      setSearchResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await searchFoods(query);
      setSearchResults(results as FoodsState['searchResults']);
    } catch (err) {
      setError(toErrorMessage(err));
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (selectedPeriod: FoodsState['period'] = period): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const s = await getFoodSummary(selectedPeriod);
      setSummary(s);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  const fetchAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [mealList, summaryData] = await Promise.all([
        getMeals(),
        getFoodSummary(period)
      ]);
      setMeals(mealList as Meal[]);
      setSummary(summaryData);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const addFoodToCurrentMeal = useCallback((food: FoodEntry): void => {
    setCurrentMeal((prev) => [...prev, food]);
  }, []);

  const removeFoodFromCurrentMeal = useCallback((index: number): void => {
    setCurrentMeal((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateFoodInCurrentMeal = useCallback((index: number, updatedFood: FoodEntry): void => {
    setCurrentMeal((prev) => prev.map((food, i) => (i === index ? updatedFood : food)));
  }, []);

  const clearCurrentMeal = useCallback((): void => {
    setCurrentMeal([]);
    setMealName('');
    setEditingMealId(null);
  }, []);

  const startEditingMeal = useCallback((meal: Meal): void => {
    setEditingMealId(meal.id);
    setMealName(meal.name);
    setCurrentMeal([...meal.foods]);
  }, []);

  const saveMeal = useCallback(async (name: string): Promise<void> => {
    if (!name || currentMeal.length === 0) {
      setError('Meal name and at least one food item required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (editingMealId) {
        await updateMeal(editingMealId, name, currentMeal);
      } else {
        await postMeal(name, currentMeal);
      }
      clearCurrentMeal();
      await fetchAll();
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [editingMealId, currentMeal, clearCurrentMeal, fetchAll]);

  const deleteMealEntry = useCallback(async (id: number | string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await deleteMeal(id);
      await fetchAll();
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  /** Switches the summary period and immediately re-fetches the summary without reloading the meal list. */
  const changePeriod = useCallback((newPeriod: FoodsState['period']): void => {
    setPeriod(newPeriod);
    void fetchSummary(newPeriod);
  }, [fetchSummary]);

  return {
    searchResults,
    meals,
    currentMeal,
    mealName,
    editingMealId,
    summary,
    period,
    loading,
    error,
    search,
    addFoodToCurrentMeal,
    removeFoodFromCurrentMeal,
    updateFoodInCurrentMeal,
    clearCurrentMeal,
    saveMeal,
    startEditingMeal,
    deleteMealEntry,
    setMealName,
    fetchSummary,
    changePeriod
  };
}
