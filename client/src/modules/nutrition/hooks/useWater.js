import { useEffect, useState, useCallback } from 'react';
import { getWaterEntries, getWaterSummary, postWater } from '../../../api/nutrition';

export default function useWater() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        getWaterEntries(),
        getWaterSummary({ period: 'daily' }),
      ]);
      setEntries(entriesRes);
      setSummary(summaryRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addEntry = useCallback(async ({ volumeMl }) => {
    setLoading(true);
    setError(null);
    try {
      const created = await postWater({ volumeMl });
      // optimistic: re-fetch list
      await fetchAll();
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  const refreshSummary = useCallback(async (period = 'daily') => {
    setLoading(true);
    try {
      const s = await getWaterSummary({ period });
      setSummary(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { entries, summary, loading, error, addEntry, fetchAll, refreshSummary };
}
