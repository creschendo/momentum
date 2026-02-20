import { useEffect, useState, useCallback } from 'react';
import { searchFoods, postMeal, getFoodSummary, getMeals, updateMeal, deleteMeal } from '../../../api/nutrition';

export default function useFoods() {
  // This hook owns search results, staged meal editing, saved meals, and summaries.
  const [searchResults, setSearchResults] = useState(null);
  const [meals, setMeals] = useState([]);
  const [currentMeal, setCurrentMeal] = useState([]);  // Foods being staged for current meal
  const [mealName, setMealName] = useState('');
  const [editingMealId, setEditingMealId] = useState(null);  // ID of meal being edited
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await searchFoods(query);
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (selectedPeriod = period) => {
    setLoading(true);
    setError(null);
    try {
      const s = await getFoodSummary(selectedPeriod);
      console.log('Summary fetched:', s);
      setSummary(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mealList = await getMeals();
      setMeals(mealList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Keeps meals and nutrition summary in sync after writes.
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mealList, summaryData] = await Promise.all([
        getMeals(),
        getFoodSummary(period)
      ]);
      setMeals(mealList);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addFoodToCurrentMeal = useCallback((food) => {
    setCurrentMeal(prev => [...prev, food]);
  }, []);

  const removeFoodFromCurrentMeal = useCallback((index) => {
    setCurrentMeal(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateFoodInCurrentMeal = useCallback((index, updatedFood) => {
    setCurrentMeal(prev => prev.map((food, i) => i === index ? updatedFood : food));
  }, []);

  const clearCurrentMeal = useCallback(() => {
    setCurrentMeal([]);
    setMealName('');
    setEditingMealId(null);
  }, []);

  const startEditingMeal = useCallback((meal) => {
    setEditingMealId(meal.id);
    setMealName(meal.name);
    setCurrentMeal([...meal.foods]);
  }, []);

  // Saves a new meal or updates the currently edited one.
  const saveMeal = useCallback(async (name) => {
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
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [editingMealId, currentMeal, clearCurrentMeal, fetchAll]);

  const deleteMealEntry = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteMeal(id);
      // Refresh both meals and summary after deleting
      await fetchAll();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  const changePeriod = useCallback((newPeriod) => {
    setPeriod(newPeriod);
    fetchSummary(newPeriod);
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
