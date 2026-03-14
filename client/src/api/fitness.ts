// Fitness API — CRUD for workout splits, training days, lift exercises, and cardio entries.
// A split is a named training program containing multiple days, each with lifts and cardio.

/** A single strength/lift exercise within a training day. Shape is flexible to accommodate different exercise schemas. */
export interface FitnessLift {
  id?: number | string;
  [key: string]: unknown;
}

/** A single cardio entry within a training day. Shape is flexible to accommodate different cardio types. */
export interface FitnessCardio {
  id?: number | string;
  [key: string]: unknown;
}

/** A single training day within a split, containing its lifts and cardio exercises. */
export interface FitnessDay {
  id: number | string;
  name: string;
  lifts: FitnessLift[];
  cardio: FitnessCardio[];
}

/** A named workout program (e.g. "Push/Pull/Legs") composed of multiple training days. */
export interface FitnessSplit {
  id: number | string;
  name: string;
  days: FitnessDay[];
}

/**
 * Safely parses a JSON response body, returning null for empty or malformed bodies.
 * Guards against parse errors from non-JSON server error responses.
 */
async function safeJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Returns all workout splits for the authenticated user. */
export async function getSplits(): Promise<FitnessSplit[]> {
  const res = await fetch('/api/fitness/splits');
  const data = await safeJson<FitnessSplit[] | Record<string, unknown>>(res);
  return Array.isArray(data) ? data : [];
}

/** Returns a single split by ID, including all days, lifts, and cardio. Returns null if not found. */
export async function getSplit(id: number | string): Promise<FitnessSplit | null> {
  const res = await fetch(`/api/fitness/splits/${id}`);
  return safeJson<FitnessSplit>(res);
}

/** Creates a new workout split with the given title and number of training days. */
export async function createSplit(title: string, days: number): Promise<Record<string, unknown> | null> {
  const res = await fetch('/api/fitness/splits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, days })
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Updates top-level fields of an existing split (e.g. name). */
export async function updateSplit(id: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Permanently deletes a split and all its associated days, lifts, and cardio entries. */
export async function deleteSplit(id: number | string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${id}`, {
    method: 'DELETE'
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Adds a new named training day to the given split. */
export async function addDay(splitId: number | string, name: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Updates fields of a training day within a split (e.g. rename the day). */
export async function updateDay(splitId: number | string, dayId: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Removes a training day and all its exercises from the given split. */
export async function deleteDay(splitId: number | string, dayId: number | string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}`, {
    method: 'DELETE'
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Adds a lift exercise to a specific day within a split. */
export async function addLift(splitId: number | string, dayId: number | string, lift: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/lifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lift)
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Updates fields of an existing lift exercise (e.g. sets, reps, weight). */
export async function updateLift(splitId: number | string, dayId: number | string, liftId: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/lifts/${liftId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Removes a lift exercise from a training day. */
export async function deleteLift(splitId: number | string, dayId: number | string, liftId: number | string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/lifts/${liftId}`, {
    method: 'DELETE'
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Adds a cardio entry to a specific day within a split. */
export async function addCardio(splitId: number | string, dayId: number | string, cardio: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/cardio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardio)
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Updates fields of an existing cardio entry (e.g. duration, distance, intensity). */
export async function updateCardio(splitId: number | string, dayId: number | string, cardioId: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/cardio/${cardioId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson<Record<string, unknown>>(res);
}

/** Removes a cardio entry from a training day. */
export async function deleteCardio(splitId: number | string, dayId: number | string, cardioId: number | string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/cardio/${cardioId}`, {
    method: 'DELETE'
  });
  return safeJson<Record<string, unknown>>(res);
}
