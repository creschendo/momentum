import { useCallback, useEffect, useState } from 'react';
import { deleteWeightEntry, getWeightEntries, getWeightTrend, postWeight } from '../../../api/nutrition';

export default function useWeight() {
  const [entries, setEntries] = useState([]);
  const [trend, setTrend] = useState({ days: 30, points: [], stats: { count: 0, latestKg: null, startKg: null, changeKg: 0 } });
  const [windowDays, setWindowDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (days = windowDays) => {
    setLoading(true);
    setError(null);
    try {
      const [recentEntries, trendData] = await Promise.all([
        getWeightEntries({ limit: 90 }),
        getWeightTrend({ days })
      ]);
      setEntries(recentEntries);
      setTrend(trendData);
      setWindowDays(days);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    refresh(30);
  }, [refresh]);

  const saveEntry = useCallback(async ({ weightKg, entryDate, note }) => {
    setLoading(true);
    setError(null);
    try {
      const saved = await postWeight({ weightKg, entryDate, note });
      await refresh(windowDays);
      return saved;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refresh, windowDays]);

  const removeEntry = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteWeightEntry(id);
      await refresh(windowDays);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refresh, windowDays]);

  const changeWindow = useCallback(async (days) => {
    await refresh(days);
  }, [refresh]);

  return {
    entries,
    trend,
    windowDays,
    loading,
    error,
    saveEntry,
    removeEntry,
    changeWindow,
    refresh
  };
}
