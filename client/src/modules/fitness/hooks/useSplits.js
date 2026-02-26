import { useState, useEffect } from 'react';
import * as fitnessApi from '../../../api/fitness';

export default function useSplits() {
  // Centralized split state used by the Splits planner UI.
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initial load and refresh path for all split data.
  const fetchSplits = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fitnessApi.getSplits();
      console.log('Fetched splits:', data);
      setSplits(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSplits();
  }, []);

  const createSplit = async (title, days) => {
    try {
      const newSplit = await fitnessApi.createSplit(title, days);
      setSplits((prev) => [...prev, newSplit]);
      return newSplit;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateSplit = async (id, updates) => {
    try {
      console.log('Updating split with:', updates);
      const updated = await fitnessApi.updateSplit(id, updates);
      console.log('Split updated:', updated);
      setSplits(splits.map(s => s.id === id ? updated : s));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteSplit = async (id) => {
    try {
      await fitnessApi.deleteSplit(id);
      setSplits(splits.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const addDay = async (splitId, name) => {
    try {
      const newDay = await fitnessApi.addDay(splitId, name);
      setSplits(splits.map(s => 
        s.id === splitId ? { ...s, days: [...(s.days || []), newDay] } : s
      ));
      return newDay;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateDay = async (splitId, dayId, updates) => {
    try {
      const updated = await fitnessApi.updateDay(splitId, dayId, updates);
      setSplits(splits.map(s =>
        s.id === splitId
          ? { ...s, days: s.days.map(d => d.id === dayId ? { ...d, ...updated } : d) }
          : s
      ));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDay = async (splitId, dayId) => {
    try {
      await fitnessApi.deleteDay(splitId, dayId);
      setSplits(splits.map(s =>
        s.id === splitId
          ? { ...s, days: s.days.filter(d => d.id !== dayId) }
          : s
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Nested helpers below update deep split/day/lift/cardio structures in-place.
  const addLift = async (splitId, dayId, lift) => {
    try {
      console.log('Adding lift:', { splitId, dayId, lift });
      const newLift = await fitnessApi.addLift(splitId, dayId, lift);
      console.log('Lift added:', newLift);
      setSplits(splits.map(s => 
        s.id === splitId 
          ? { ...s, days: s.days.map(d => 
              d.id === dayId ? { ...d, lifts: [...(d.lifts || []), newLift] } : d
            )}
          : s
      ));
      return newLift;
    } catch (err) {
      console.error('Failed to add lift:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateLift = async (splitId, dayId, liftId, updates) => {
    try {
      const updated = await fitnessApi.updateLift(splitId, dayId, liftId, updates);
      setSplits(splits.map(s =>
        s.id === splitId
          ? { ...s, days: s.days.map(d =>
              d.id === dayId
                ? { ...d, lifts: d.lifts.map(l => l.id === liftId ? updated : l) }
                : d
            )}
          : s
      ));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteLift = async (splitId, dayId, liftId) => {
    try {
      await fitnessApi.deleteLift(splitId, dayId, liftId);
      setSplits(splits.map(s =>
        s.id === splitId
          ? { ...s, days: s.days.map(d =>
              d.id === dayId
                ? { ...d, lifts: d.lifts.filter(l => l.id !== liftId) }
                : d
            )}
          : s
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const addCardio = async (splitId, dayId, cardio) => {
    try {
      const newCardio = await fitnessApi.addCardio(splitId, dayId, cardio);
      setSplits(splits.map(s =>
        s.id === splitId
          ? { ...s, days: s.days.map(d =>
              d.id === dayId ? { ...d, cardio: [...(d.cardio || []), newCardio] } : d
            )}
          : s
      ));
      return newCardio;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateCardio = async (splitId, dayId, cardioId, updates) => {
    try {
      const updated = await fitnessApi.updateCardio(splitId, dayId, cardioId, updates);
      setSplits(splits.map(s =>
        s.id === splitId
          ? { ...s, days: s.days.map(d =>
              d.id === dayId
                ? { ...d, cardio: d.cardio.map(c => c.id === cardioId ? updated : c) }
                : d
            )}
          : s
      ));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteCardio = async (splitId, dayId, cardioId) => {
    try {
      await fitnessApi.deleteCardio(splitId, dayId, cardioId);
      setSplits(splits.map(s =>
        s.id === splitId
          ? { ...s, days: s.days.map(d =>
              d.id === dayId
                ? { ...d, cardio: d.cardio.filter(c => c.id !== cardioId) }
                : d
            )}
          : s
      ));
    } catch (err) {
      setError(err.message);
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
