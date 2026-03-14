// Nutrition API — water intake, body weight, food entries, meals, food search, and TDEE calculation.

/** A single water intake log entry. */
export interface WaterEntry {
  id: number | string;
  volumeMl: number;
  timestamp: string;
}

/** A single body weight measurement. */
export interface WeightEntry {
  id: number | string;
  weightKg: number;
  entryDate: string;
  note?: string | null;
}

/** A logged food item with optional macronutrient breakdown. */
export interface FoodEntry {
  id?: number | string;
  foodName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  timestamp?: string;
}

/** A named meal grouping one or more food entries together. */
export interface Meal {
  id: number | string;
  name: string;
  foods: FoodEntry[];
  timestamp?: string;
}

/** Inputs required to calculate Total Daily Energy Expenditure (TDEE) via the Mifflin-St Jeor formula. */
export interface TdeeInput {
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  activity_level: number;
}

/** Parses an error response and throws with the server's error message or a fallback. */
async function parseError(res: Response, fallback: string): Promise<never> {
  const payload = await res.json().catch(() => null) as { error?: string } | null;
  throw new Error(payload?.error || fallback);
}

/** Logs a water intake entry. Timestamp defaults to now on the server if omitted. */
export async function postWater({ volumeMl, timestamp }: { volumeMl: number; timestamp?: string }): Promise<WaterEntry> {
  const res = await fetch('/api/nutrition/water', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volumeMl, timestamp })
  });
  if (!res.ok) return parseError(res, 'Failed to post water');
  return res.json() as Promise<WaterEntry>;
}

/** Returns water entries, optionally filtered to those after the given ISO timestamp. */
export async function getWaterEntries({ since }: { since?: string } = {}): Promise<WaterEntry[]> {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/nutrition/water/entries${q}`);
  if (!res.ok) throw new Error('Failed to get entries');
  return res.json() as Promise<WaterEntry[]>;
}

/** Returns aggregated water intake stats for the given period (daily/weekly/monthly). */
export async function getWaterSummary({ period = 'daily' }: { period?: 'daily' | 'weekly' | 'monthly' } = {}): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/water/summary?period=${encodeURIComponent(period)}`);
  if (!res.ok) throw new Error('Failed to get summary');
  return res.json() as Promise<Record<string, unknown>>;
}

/** Deletes all water entries for the authenticated user. Used to reset daily tracking. */
export async function resetWaterEntries(): Promise<{ message: string; count: number }> {
  const res = await fetch('/api/nutrition/water/reset', {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to reset water entries');
  return res.json() as Promise<{ message: string; count: number }>;
}

/** Logs a body weight measurement. entryDate defaults to today if omitted. */
export async function postWeight({ weightKg, entryDate, note }: { weightKg: number; entryDate?: string; note?: string }): Promise<WeightEntry> {
  const res = await fetch('/api/nutrition/weight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weightKg, entryDate, note })
  });
  if (!res.ok) return parseError(res, 'Failed to save weight');
  return res.json() as Promise<WeightEntry>;
}

/** Returns the most recent weight entries. Defaults to 90 entries (≈3 months). */
export async function getWeightEntries({ limit = 90 }: { limit?: number } = {}): Promise<WeightEntry[]> {
  const res = await fetch(`/api/nutrition/weight/entries?limit=${encodeURIComponent(limit)}`);
  if (!res.ok) throw new Error('Failed to get weight entries');
  return res.json() as Promise<WeightEntry[]>;
}

/** Returns a weight trend analysis over the last N days (moving averages, direction, etc.). Defaults to 30. */
export async function getWeightTrend({ days = 30 }: { days?: number } = {}): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/weight/trend?days=${encodeURIComponent(days)}`);
  if (!res.ok) throw new Error('Failed to get weight trend');
  return res.json() as Promise<Record<string, unknown>>;
}

/** Deletes a weight entry by ID. */
export async function deleteWeightEntry(id: number | string): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/nutrition/weight/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) return parseError(res, 'Failed to delete weight entry');
  return res.json() as Promise<{ ok: boolean }>;
}

/** Searches the food database by name. Returns matching foods with nutritional info. */
export async function searchFoods(query: string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json() as Promise<Record<string, unknown>>;
}

/** Logs a food entry with its full macronutrient breakdown. */
export async function postFood(foodName: string, calories: number, protein: number, carbs: number, fat: number): Promise<FoodEntry> {
  const res = await fetch('/api/nutrition/foods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foodName, calories, protein, carbs, fat })
  });
  if (!res.ok) throw new Error('Add food failed');
  return res.json() as Promise<FoodEntry>;
}

/** Returns food entries, optionally filtered to those after the given ISO timestamp. */
export async function getFoodEntries({ since }: { since?: string } = {}): Promise<FoodEntry[]> {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/nutrition/foods${q}`);
  if (!res.ok) throw new Error('Failed to get food entries');
  return res.json() as Promise<FoodEntry[]>;
}

/** Deletes a food entry by ID. */
export async function deleteFoodEntry(id: number | string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/foods/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete food entry');
  return res.json() as Promise<Record<string, unknown>>;
}

/** Returns aggregated macro totals for food entries over the given period (daily/weekly/monthly). */
export async function getFoodSummary(period = 'daily'): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/foods/summary?period=${period}`);
  if (!res.ok) throw new Error('Summary failed');
  return res.json() as Promise<Record<string, unknown>>;
}

/** Creates a named meal containing one or more food entries. */
export async function postMeal(name: string, foods: FoodEntry[], timestamp?: string): Promise<Meal> {
  const res = await fetch('/api/nutrition/meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, foods, timestamp })
  });
  if (!res.ok) throw new Error('Add meal failed');
  return res.json() as Promise<Meal>;
}

/** Returns all meals, optionally filtered to those after the given ISO timestamp. */
export async function getMeals({ since }: { since?: string } = {}): Promise<Meal[]> {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/nutrition/meals${q}`);
  if (!res.ok) throw new Error('Failed to get meals');
  return res.json() as Promise<Meal[]>;
}

/** Updates a meal's name and/or food list. Omitted fields are left unchanged. */
export async function updateMeal(id: number | string, name?: string, foods?: FoodEntry[]): Promise<Meal> {
  const res = await fetch(`/api/nutrition/meals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, foods })
  });
  if (!res.ok) throw new Error('Failed to update meal');
  return res.json() as Promise<Meal>;
}

/** Deletes a meal by ID. */
export async function deleteMeal(id: number | string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/nutrition/meals/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete meal');
  return res.json() as Promise<Record<string, unknown>>;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) using provided anthropometric data.
 * Returns BMR, TDEE, and macro recommendations based on activity level.
 */
export async function calculateTDEE({ age, sex, height_cm, weight_kg, activity_level }: TdeeInput): Promise<Record<string, unknown>> {
  const res = await fetch('/api/nutrition/tdee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ age, sex, height_cm, weight_kg, activity_level })
  });
  if (!res.ok) throw new Error('TDEE calculation failed');
  return res.json() as Promise<Record<string, unknown>>;
}
