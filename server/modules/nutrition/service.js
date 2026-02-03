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

const foodEntries = [];

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

  const totals = foodEntries.reduce((acc, e) => {
    const t = new Date(e.timestamp);
    if (t >= start) {
      return {
        calories: acc.calories + (Number(e.calories) || 0),
        protein: acc.protein + (Number(e.protein) || 0),
        carbs: acc.carbs + (Number(e.carbs) || 0),
        fat: acc.fat + (Number(e.fat) || 0),
        count: acc.count + 1
      };
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
export default { addWaterEntry, listEntries, sumForPeriod, addFoodEntry, getFoodEntries, getMacroSummary };
