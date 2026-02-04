// Simple in-memory service for water intake tracking.
// For real apps, replace with a persistent repository (DB).

const entries = [];

function addWaterEntry({ volumeMl, timestamp }) {
  const ts = timestamp ? new Date(timestamp) : new Date();
  const entry = { id: String(Date.now()) + Math.random().toString(36).slice(2), volumeMl, timestamp: ts.toISOString() };
  entries.push(entry);
  return entry;
}

function listEntries({ since } = {}) {
  if (!since) return [...entries].sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
  const sinceDate = new Date(since);
  return entries.filter(e => new Date(e.timestamp) >= sinceDate).sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
}

function sumForPeriod(period = 'daily') {
  // period: 'daily' | 'weekly' | 'monthly'
  const now = new Date();
  let start;
  if (period === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'weekly') {
    // week starting Monday
    const day = now.getDay();
    const diff = (day + 6) % 7; // days since Monday
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    throw new Error('invalid period');
  }
  const total = entries.reduce((acc, e) => {
    const t = new Date(e.timestamp);
    if (t >= start) return acc + Number(e.volumeMl || 0);
    return acc;
  }, 0);
  return { period, start: start.toISOString(), totalMl: total };
}

function resetWaterEntries() {
  entries.length = 0;
  return { message: 'Water entries reset', count: 0 };
}

const foodEntries = [];

// Meal structure: { id, name, timestamp, foods: [{ foodName, calories, protein, carbs, fat }] }
const meals = [];

function addMeal({ name, foods, timestamp }) {
  const meal = {
    id: String(Date.now()) + Math.random().toString(36).slice(2),
    name,
    foods: foods || [],
    timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
  };
  meals.push(meal);
  return meal;
}

function getMeals({ since } = {}) {
  if (!since) return [...meals].sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
  const sinceDate = new Date(since);
  return meals.filter(m => new Date(m.timestamp) >= sinceDate).sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
}

function updateMeal(id, { name, foods }) {
  const index = meals.findIndex(m => m.id === id);
  if (index === -1) {
    throw new Error('Meal not found');
  }
  if (name !== undefined) meals[index].name = name;
  if (foods !== undefined) meals[index].foods = foods;
  return meals[index];
}

function deleteMeal(id) {
  const index = meals.findIndex(m => m.id === id);
  if (index === -1) {
    throw new Error('Meal not found');
  }
  const deleted = meals.splice(index, 1)[0];
  return { message: 'Meal deleted', meal: deleted };
}

function addFoodEntry({ foodName, calories, protein, carbs, fat, timestamp }) {
  const entry = {
    id: String(Date.now()) + Math.random().toString(36).slice(2),
    foodName, calories, protein, carbs, fat,
    timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
  };
  foodEntries.push(entry);
  return entry;
}

function getFoodEntries({ since } = {}) {
  if (!since) return [...foodEntries].sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
  const sinceDate = new Date(since);
  return foodEntries.filter(e => new Date(e.timestamp) >= sinceDate).sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
}

function deleteFoodEntry(id) {
  const index = foodEntries.findIndex(e => e.id === id);
  if (index === -1) {
    throw new Error('Food entry not found');
  }
  const deleted = foodEntries.splice(index, 1)[0];
  return { message: 'Food entry deleted', entry: deleted };
}

function getMacroSummary(period = 'daily') {
  const now = new Date();
  let start;

  if (period === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'weekly') {
    const day = now.getDay();
    const diff = (day + 6) % 7;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    throw new Error('invalid period');
  }

  const totals = meals.reduce((acc, meal) => {
    const t = new Date(meal.timestamp);
    if (t >= start) {
      meal.foods.forEach(food => {
        acc.calories += Number(food.calories) || 0;
        acc.protein += Number(food.protein) || 0;
        acc.carbs += Number(food.carbs) || 0;
        acc.fat += Number(food.fat) || 0;
      });
      acc.count += 1;
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 });

  // for weekly, calculate daily averages
  if (period === 'weekly') {
    const daysSinceStart = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    return {
      period,
      start: start.toISOString(),
      avgCalories: Math.round(totals.calories / daysSinceStart),
      avgProtein: Math.round(totals.protein / daysSinceStart),
      avgCarbs: Math.round(totals.carbs / daysSinceStart),
      avgFat: Math.round(totals.fat / daysSinceStart),
      days: daysSinceStart,
      entryCount: totals.count
    };
  }

  // For daily, return totals
  return {
    period,
    start: start.toISOString(),
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    entryCount: totals.count
  };
}
export default { 
  addWaterEntry, 
  listEntries, 
  sumForPeriod, 
  resetWaterEntries, 
  addFoodEntry, 
  getFoodEntries, 
  deleteFoodEntry, 
  getMacroSummary,
  addMeal,
  getMeals,
  updateMeal,
  deleteMeal
};
