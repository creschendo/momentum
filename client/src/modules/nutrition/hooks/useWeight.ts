// useWeight — hook managing body weight entries and trend analysis for the WeightTracker component.
import { useCallback, useEffect, useState } from 'react';
import { deleteWeightEntry, getWeightEntries, getWeightTrend, postWeight, type WeightEntry } from '../../../api/nutrition';
import type { WeightState, WeightTrend } from '../../../types/modules';

/** Extracts a string error message from any thrown value. */
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/** Coerces the loosely-typed API trend response into the strongly-typed WeightTrend shape. */
function normalizeTrend(value: Record<string, unknown>): WeightTrend {
  const stats = (value.stats ?? {}) as Record<string, unknown>;
  const points = Array.isArray(value.points) ? value.points : [];
  return {
    days: Number(value.days ?? 30),
    points: points as WeightTrend['points'],
    stats: {
      count: Number(stats.count ?? 0),
      latestKg: stats.latestKg == null ? null : Number(stats.latestKg),
      startKg: stats.startKg == null ? null : Number(stats.startKg),
      changeKg: Number(stats.changeKg ?? 0)
    }
  };
}

/** Initial trend state used before the first fetch completes to avoid null checks. */
const EMPTY_TREND: WeightTrend = {
  days: 30,
  points: [],
  stats: { count: 0, latestKg: null, startKg: null, changeKg: 0 }
};

/**
 * Provides weight entry state and actions.
 * - `entries`: up to 90 most recent entries (≈3 months)
 * - `trend`: computed stats and data points for the active window
 * - `windowDays`: the currently selected trend window (default 30)
 * - `saveEntry` / `removeEntry`: mutate and refresh
 * - `changeWindow`: switches the trend window and re-fetches
 */
export default function useWeight() {
  const [entries, setEntries] = useState<WeightState['entries']>([]);
  const [trend, setTrend] = useState<WeightTrend>(EMPTY_TREND);
  const [windowDays, setWindowDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (days: number = windowDays): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [recentEntries, trendData] = await Promise.all([
        getWeightEntries({ limit: 90 }),
        getWeightTrend({ days })
      ]);
      setEntries(recentEntries);
      setTrend(normalizeTrend(trendData));
      setWindowDays(days);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    void refresh(30);
  }, [refresh]);

  const saveEntry = useCallback(async ({ weightKg, entryDate, note }: { weightKg: number; entryDate?: string; note?: string }): Promise<WeightEntry> => {
    setLoading(true);
    setError(null);
    try {
      const saved = await postWeight({ weightKg, entryDate, note });
      await refresh(windowDays);
      return saved;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refresh, windowDays]);

  const removeEntry = useCallback(async (id: number | string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await deleteWeightEntry(id);
      await refresh(windowDays);
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refresh, windowDays]);

  const changeWindow = useCallback(async (days: number): Promise<void> => {
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
