import { useEffect, useState, useCallback } from 'react';
import { searchFoods, postFood, getFoodSummary } from '../../../api/nutrition';

export default function useFoods() {
  const [searchResults, setSearchResults] = useState(null);
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
      setSummary(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const addFood = useCallback(async (foodName, calories, protein, carbs, fat) => {
    setLoading(true);
    setError(null);
    try {
      const created = await postFood(foodName, calories, protein, carbs, fat);
      // Refresh summary after adding
      await fetchSummary();
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSummary]);

  const changePeriod = useCallback((newPeriod) => {
    setPeriod(newPeriod);
    fetchSummary(newPeriod);
  }, [fetchSummary]);

  return { 
    searchResults, 
    summary, 
    period,
    loading, 
    error, 
    search, 
    addFood, 
    fetchSummary,
    changePeriod
  };
}
