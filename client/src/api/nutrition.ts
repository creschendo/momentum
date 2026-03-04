export interface WaterEntry {
  id: number | string;
  volumeMl: number;
  timestamp: string;
}

export interface WeightEntry {
  id: number | string;
  weightKg: number;
  entryDate: string;
  note?: string | null;
}

export interface FoodEntry {
  id?: number | string;
  foodName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  timestamp?: string;
}

export interface Meal {
  id: number | string;
  name: string;
  foods: FoodEntry[];
  timestamp?: string;
}

export interface TdeeInput {
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  activity_level: number;
}

async function parseError(res: Response, fallback: string): Promise<never> {
  const payload = await res.json().catch(() => null) as { error?: string } | null;
  throw new Error(payload?.error || fallback);
}

export async function postWater({ volumeMl, timestamp }: { volumeMl: number; timestamp?: string }): Promise<WaterEntry> {
  const res = await fetch('/api/nutrition/water', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volumeMl, timestamp })
  });
  if (!res.ok) return parseError(res, 'Failed to post water');
  return res.json() as Promise<WaterEntry>;
}

export async function getWaterEntries({ since }: { since?: string } = {}): Promise<WaterEntry[]> {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/nutrition/water/entries${q}`);
  if (!res.ok) throw new Error('Failed to get entries');
  return res.json() as Promise<WaterEntry[]>;
}

export async function getWaterSummary({ period = 'daily' }: { period?: 'daily' | 'weekly' | 'monthly' } = {}): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/water/summary?period=${encodeURIComponent(period)}`);
  if (!res.ok) throw new Error('Failed to get summary');
  return res.json() as Promise<Record<string, unknown>>;
}

export async function resetWaterEntries(): Promise<{ message: string; count: number }> {
  const res = await fetch('/api/nutrition/water/reset', {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to reset water entries');
  return res.json() as Promise<{ message: string; count: number }>;
}

export async function postWeight({ weightKg, entryDate, note }: { weightKg: number; entryDate?: string; note?: string }): Promise<WeightEntry> {
  const res = await fetch('/api/nutrition/weight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weightKg, entryDate, note })
  });
  if (!res.ok) return parseError(res, 'Failed to save weight');
  return res.json() as Promise<WeightEntry>;
}

export async function getWeightEntries({ limit = 90 }: { limit?: number } = {}): Promise<WeightEntry[]> {
  const res = await fetch(`/api/nutrition/weight/entries?limit=${encodeURIComponent(limit)}`);
  if (!res.ok) throw new Error('Failed to get weight entries');
  return res.json() as Promise<WeightEntry[]>;
}

export async function getWeightTrend({ days = 30 }: { days?: number } = {}): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/weight/trend?days=${encodeURIComponent(days)}`);
  if (!res.ok) throw new Error('Failed to get weight trend');
  return res.json() as Promise<Record<string, unknown>>;
}

export async function deleteWeightEntry(id: number | string): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/nutrition/weight/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) return parseError(res, 'Failed to delete weight entry');
  return res.json() as Promise<{ ok: boolean }>;
}

export async function searchFoods(query: string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json() as Promise<Record<string, unknown>>;
}

export async function postFood(foodName: string, calories: number, protein: number, carbs: number, fat: number): Promise<FoodEntry> {
  const res = await fetch('/api/nutrition/foods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foodName, calories, protein, carbs, fat })
  });
  if (!res.ok) throw new Error('Add food failed');
  return res.json() as Promise<FoodEntry>;
}

export async function getFoodEntries({ since }: { since?: string } = {}): Promise<FoodEntry[]> {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/nutrition/foods${q}`);
  if (!res.ok) throw new Error('Failed to get food entries');
  return res.json() as Promise<FoodEntry[]>;
}

export async function deleteFoodEntry(id: number | string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/foods/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete food entry');
  return res.json() as Promise<Record<string, unknown>>;
}

export async function getFoodSummary(period = 'daily'): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/foods/summary?period=${period}`);
  if (!res.ok) throw new Error('Summary failed');
  return res.json() as Promise<Record<string, unknown>>;
}

export async function postMeal(name: string, foods: FoodEntry[], timestamp?: string): Promise<Meal> {
  const res = await fetch('/api/nutrition/meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, foods, timestamp })
  });
  if (!res.ok) throw new Error('Add meal failed');
  return res.json() as Promise<Meal>;
}

export async function getMeals({ since }: { since?: string } = {}): Promise<Meal[]> {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/nutrition/meals${q}`);
  if (!res.ok) throw new Error('Failed to get meals');
  return res.json() as Promise<Meal[]>;
}

export async function updateMeal(id: number | string, name?: string, foods?: FoodEntry[]): Promise<Meal> {
  const res = await fetch(`/api/nutrition/meals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, foods })
  });
  if (!res.ok) throw new Error('Failed to update meal');
  return res.json() as Promise<Meal>;
}

export async function deleteMeal(id: number | string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/meals/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete meal');
  return res.json() as Promise<Record<string, unknown>>;
}

export async function calculateTDEE({ age, sex, height_cm, weight_kg, activity_level }: TdeeInput): Promise<Record<string, unknown>> {
  const res = await fetch('/api/nutrition/tdee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ age, sex, height_cm, weight_kg, activity_level })
  });
  if (!res.ok) throw new Error('TDEE calculation failed');
  return res.json() as Promise<Record<string, unknown>>;
}
