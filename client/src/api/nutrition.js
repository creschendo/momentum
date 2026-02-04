// Thin API wrapper for nutrition endpoints.
export async function postWater({ volumeMl, timestamp }) {
  const res = await fetch('/api/nutrition/water', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volumeMl, timestamp }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to post water');
  return res.json();
}

export async function getWaterEntries({ since } = {}) {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/nutrition/water/entries${q}`);
  if (!res.ok) throw new Error('Failed to get entries');
  return res.json();
}

export async function getWaterSummary({ period = 'daily' } = {}) {
  const res = await fetch(`/api/nutrition/water/summary?period=${encodeURIComponent(period)}`);
  if (!res.ok) throw new Error('Failed to get summary');
  return res.json();
}

export async function resetWaterEntries() {
  const res = await fetch('/api/nutrition/water/reset', { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to reset water entries');
  return res.json();
}

// Search foods via CalorieNinjas
export async function searchFoods(query) {
  const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

// Add a food entry with macros
export async function postFood(foodName, calories, protein, carbs, fat) {
  const res = await fetch('/api/nutrition/foods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foodName, calories, protein, carbs, fat })
  });
  if (!res.ok) throw new Error('Add food failed');
  return res.json();
}

// Get food entries
export async function getFoodEntries({ since } = {}) {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/nutrition/foods${q}`);
  if (!res.ok) throw new Error('Failed to get food entries');
  return res.json();
}

// Delete a food entry
export async function deleteFoodEntry(id) {
  const res = await fetch(`/api/nutrition/foods/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete food entry');
  return res.json();
}

// Get macro summary 
export async function getFoodSummary(period = 'daily') {
  const res = await fetch(`/api/nutrition/foods/summary?period=${period}`);
  if (!res.ok) throw new Error('Summary failed');
  return res.json();
}

// Add a meal with multiple foods
export async function postMeal(name, foods, timestamp) {
  const res = await fetch('/api/nutrition/meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, foods, timestamp })
  });
  if (!res.ok) throw new Error('Add meal failed');
  return res.json();
}

// Get all meals
export async function getMeals({ since } = {}) {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/nutrition/meals${q}`);
  if (!res.ok) throw new Error('Failed to get meals');
  return res.json();
}

// Update a meal
export async function updateMeal(id, name, foods) {
  const res = await fetch(`/api/nutrition/meals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, foods })
  });
  if (!res.ok) throw new Error('Failed to update meal');
  return res.json();
}

// Delete a meal
export async function deleteMeal(id) {
  const res = await fetch(`/api/nutrition/meals/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete meal');
  return res.json();
}

// Calculate TDEE and BMR
export async function calculateTDEE({ age, sex, height_cm, weight_kg, activity_level }) {
  const res = await fetch('/api/nutrition/tdee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ age, sex, height_cm, weight_kg, activity_level })
  });
  if (!res.ok) throw new Error('TDEE calculation failed');
  return res.json();
}