export interface FitnessLift {
  id?: number | string;
  [key: string]: unknown;
}

export interface FitnessCardio {
  id?: number | string;
  [key: string]: unknown;
}

export interface FitnessDay {
  id: number | string;
  name: string;
  lifts: FitnessLift[];
  cardio: FitnessCardio[];
}

export interface FitnessSplit {
  id: number | string;
  name: string;
  days: FitnessDay[];
}

async function safeJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function getSplits(): Promise<FitnessSplit[]> {
  const res = await fetch('/api/fitness/splits');
  const data = await safeJson<FitnessSplit[] | Record<string, unknown>>(res);
  return Array.isArray(data) ? data : [];
}

export async function getSplit(id: number | string): Promise<FitnessSplit | null> {
  const res = await fetch(`/api/fitness/splits/${id}`);
  return safeJson<FitnessSplit>(res);
}

export async function createSplit(title: string, days: number): Promise<Record<string, unknown> | null> {
  const res = await fetch('/api/fitness/splits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, days })
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function updateSplit(id: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function deleteSplit(id: number | string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${id}`, {
    method: 'DELETE'
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function addDay(splitId: number | string, name: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function updateDay(splitId: number | string, dayId: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function deleteDay(splitId: number | string, dayId: number | string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}`, {
    method: 'DELETE'
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function addLift(splitId: number | string, dayId: number | string, lift: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/lifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lift)
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function updateLift(splitId: number | string, dayId: number | string, liftId: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/lifts/${liftId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function deleteLift(splitId: number | string, dayId: number | string, liftId: number | string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/lifts/${liftId}`, {
    method: 'DELETE'
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function addCardio(splitId: number | string, dayId: number | string, cardio: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/cardio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cardio)
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function updateCardio(splitId: number | string, dayId: number | string, cardioId: number | string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/cardio/${cardioId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return safeJson<Record<string, unknown>>(res);
}

export async function deleteCardio(splitId: number | string, dayId: number | string, cardioId: number | string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`/api/fitness/splits/${splitId}/days/${dayId}/cardio/${cardioId}`, {
    method: 'DELETE'
  });
  return safeJson<Record<string, unknown>>(res);
}
