import { useState, useEffect } from 'react';
import * as fitnessApi from '../../../api/fitness';
import type { FitnessDay, FitnessSplit } from '../../../api/fitness';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export default function useSplits() {
  const [splits, setSplits] = useState<FitnessSplit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSplits = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fitnessApi.getSplits();
      setSplits(data);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSplits();
  }, []);

  const createSplit = async (title: string, days: number): Promise<Record<string, unknown> | null> => {
    try {
      const newSplit = await fitnessApi.createSplit(title, days);
      if (newSplit && 'id' in newSplit) {
        setSplits((prev) => [...prev, newSplit as unknown as FitnessSplit]);
      }
      return newSplit;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const updateSplit = async (id: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    try {
      const updated = await fitnessApi.updateSplit(id, updates);
      if (updated && 'id' in updated) {
        setSplits((prev) => prev.map((s) => (s.id === id ? (updated as unknown as FitnessSplit) : s)));
      }
      return updated;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const deleteSplit = async (id: number | string): Promise<void> => {
    try {
      await fitnessApi.deleteSplit(id);
      setSplits((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const addDay = async (splitId: number | string, name: string): Promise<Record<string, unknown> | null> => {
    try {
      const newDay = await fitnessApi.addDay(splitId, name);
      if (newDay && 'id' in newDay) {
        setSplits((prev) => prev.map((s) =>
          s.id === splitId ? { ...s, days: [...(s.days || []), newDay as unknown as FitnessDay] } : s
        ));
      }
      return newDay;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const updateDay = async (splitId: number | string, dayId: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    try {
      const updated = await fitnessApi.updateDay(splitId, dayId, updates);
      if (updated) {
        setSplits((prev) => prev.map((s) =>
          s.id === splitId
            ? { ...s, days: s.days.map((d) => (d.id === dayId ? ({ ...d, ...updated } as FitnessDay) : d)) }
            : s
        ));
      }
      return updated;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const deleteDay = async (splitId: number | string, dayId: number | string): Promise<void> => {
    try {
      await fitnessApi.deleteDay(splitId, dayId);
      setSplits((prev) => prev.map((s) =>
        s.id === splitId ? { ...s, days: s.days.filter((d) => d.id !== dayId) } : s
      ));
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const addLift = async (splitId: number | string, dayId: number | string, lift: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    try {
      const newLift = await fitnessApi.addLift(splitId, dayId, lift);
      if (newLift) {
        setSplits((prev) => prev.map((s) =>
          s.id === splitId
            ? { ...s, days: s.days.map((d) => (d.id === dayId ? { ...d, lifts: [...(d.lifts || []), newLift] } : d)) }
            : s
        ));
      }
      return newLift;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const updateLift = async (splitId: number | string, dayId: number | string, liftId: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    try {
      const updated = await fitnessApi.updateLift(splitId, dayId, liftId, updates);
      if (updated) {
        setSplits((prev) => prev.map((s) =>
          s.id === splitId
            ? {
                ...s,
                days: s.days.map((d) =>
                  d.id === dayId ? { ...d, lifts: (d.lifts || []).map((l) => (l.id === liftId ? updated : l)) } : d
                )
              }
            : s
        ));
      }
      return updated;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const deleteLift = async (splitId: number | string, dayId: number | string, liftId: number | string): Promise<void> => {
    try {
      await fitnessApi.deleteLift(splitId, dayId, liftId);
      setSplits((prev) => prev.map((s) =>
        s.id === splitId
          ? {
              ...s,
              days: s.days.map((d) =>
                d.id === dayId ? { ...d, lifts: (d.lifts || []).filter((l) => l.id !== liftId) } : d
              )
            }
          : s
      ));
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const addCardio = async (splitId: number | string, dayId: number | string, cardio: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    try {
      const newCardio = await fitnessApi.addCardio(splitId, dayId, cardio);
      if (newCardio) {
        setSplits((prev) => prev.map((s) =>
          s.id === splitId
            ? { ...s, days: s.days.map((d) => (d.id === dayId ? { ...d, cardio: [...(d.cardio || []), newCardio] } : d)) }
            : s
        ));
      }
      return newCardio;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const updateCardio = async (splitId: number | string, dayId: number | string, cardioId: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    try {
      const updated = await fitnessApi.updateCardio(splitId, dayId, cardioId, updates);
      if (updated) {
        setSplits((prev) => prev.map((s) =>
          s.id === splitId
            ? {
                ...s,
                days: s.days.map((d) =>
                  d.id === dayId ? { ...d, cardio: (d.cardio || []).map((c) => (c.id === cardioId ? updated : c)) } : d
                )
              }
            : s
        ));
      }
      return updated;
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  const deleteCardio = async (splitId: number | string, dayId: number | string, cardioId: number | string): Promise<void> => {
    try {
      await fitnessApi.deleteCardio(splitId, dayId, cardioId);
      setSplits((prev) => prev.map((s) =>
        s.id === splitId
          ? {
              ...s,
              days: s.days.map((d) =>
                d.id === dayId ? { ...d, cardio: (d.cardio || []).filter((c) => c.id !== cardioId) } : d
              )
            }
          : s
      ));
    } catch (err) {
      setError(toErrorMessage(err));
      throw err;
    }
  };

  return {
    splits,
    loading,
    error,
    createSplit,
    updateSplit,
    deleteSplit,
    addDay,
    updateDay,
    deleteDay,
    addLift,
    updateLift,
    deleteLift,
    addCardio,
    updateCardio,
    deleteCardio
  };
}
