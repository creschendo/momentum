// useWater — hook managing water intake entries and daily summary for the WaterTracker component.
import { useEffect, useState, useCallback } from 'react';
import { getWaterEntries, getWaterSummary, postWater, resetWaterEntries, type WaterEntry } from '../../../api/nutrition';
import type { WaterState, WaterSummary } from '../../../types/modules';

/** Extracts a string error message from any thrown value. */
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/** Coerces the loosely-typed API summary response into the strongly-typed WaterSummary shape. */
function normalizeWaterSummary(value: Record<string, unknown>): WaterSummary {
  return {
    period: String(value.period ?? 'daily'),
    start: value.start ? String(value.start) : undefined,
    totalMl: Number(value.totalMl ?? 0)
  };
}

/**
 * Provides water entry state and actions.
 * - `entries`: all entries for the current period
 * - `summary`: aggregated totals (totalMl, period, start)
 * - `addEntry`: logs a new intake and refreshes
 * - `refreshSummary`: re-fetches the summary for a different period without reloading entries
 * - `resetEntries`: deletes all entries and refreshes
 */
export default function useWater() {
  const [entries, setEntries] = useState<WaterState['entries']>([]);
  const [summary, setSummary] = useState<WaterSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        getWaterEntries(),
        getWaterSummary({ period: 'daily' })
      ]);
      setEntries(entriesRes);
      setSummary(normalizeWaterSummary(summaryRes));
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const addEntry = useCallback(async ({ volumeMl }: { volumeMl: number }): Promise<WaterEntry> => {
    setLoading(true);
    setError(null);
    try {
      const created = await postWater({ volumeMl });
      await fetchAll();
      return created;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  const refreshSummary = useCallback(async (period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<void> => {
    setLoading(true);
    try {
      const payload = await getWaterSummary({ period });
      setSummary(normalizeWaterSummary(payload));
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const resetEntries = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await resetWaterEntries();
      await fetchAll();
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  return { entries, summary, loading, error, addEntry, fetchAll, refreshSummary, resetEntries };
}
