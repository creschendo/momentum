import pool from '../../db.js';

interface MealFood {
  foodName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

/** Inserts a water intake record for the user. Uses the provided ISO
 *  timestamp or defaults to the current time. Returns the new entry row. */
async function addWaterEntry({ userId, volumeMl, timestamp }: { userId: number; volumeMl: number; timestamp?: string }) {
  const ts = timestamp ? new Date(timestamp) : new Date();
  const result = await pool.query(
    'INSERT INTO water_entries (user_id, volume_ml, timestamp) VALUES ($1, $2, $3) RETURNING id, volume_ml as "volumeMl", timestamp',
    [userId, volumeMl, ts]
  );
  return result.rows[0];
}

/** Returns all water intake entries for the user ordered newest-first.
 *  Optionally filters to entries at or after the given ISO `since` datetime. */
async function listEntries({ userId, since }: { userId: number; since?: string } = { userId: 0 }) {
  let query = 'SELECT id, volume_ml as "volumeMl", timestamp FROM water_entries WHERE user_id = $1';
  const values: (number | Date)[] = [userId];

  if (since) {
    query += ' AND timestamp >= $2';
    values.push(new Date(since));
  }

  query += ' ORDER BY timestamp DESC';
  const result = await pool.query(query, values);
  return result.rows;
}

/** Sums water intake (in mL) for the current daily, weekly, or monthly
 *  period. Calculates the period start relative to now and queries the
 *  database for the total. Throws for unrecognized period strings. */
async function sumForPeriod({ userId, period = 'daily' }: { userId: number; period?: string } = { userId: 0 }) {
  const now = new Date();
  let start: Date;

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

  const result = await pool.query(
    'SELECT COALESCE(SUM(volume_ml), 0) as total FROM water_entries WHERE user_id = $1 AND timestamp >= $2',
    [userId, start]
  );

  const total = Number(result.rows[0].total) || 0;
  return { period, start: start.toISOString(), totalMl: total };
}

/** Deletes every water intake record for the user. Returns a confirmation
 *  message and the count of deleted rows. */
async function resetWaterEntries({ userId }: { userId: number }) {
  const result = await pool.query('DELETE FROM water_entries WHERE user_id = $1', [userId]);
  return { message: 'Water entries reset', count: result.rowCount };
}

/** Inserts or updates a body-weight entry for (userId, entryDate). If a
 *  record already exists for that date it is overwritten with the new weight
 *  and note. entryDate defaults to today (YYYY-MM-DD). Returns the row. */
async function upsertWeightEntry({ userId, weightKg, entryDate, note }: { userId: number; weightKg: number; entryDate?: string; note?: string }) {
  const normalizedDate = entryDate || new Date().toISOString().slice(0, 10);
  const result = await pool.query(
    `INSERT INTO weight_entries (user_id, weight_kg, entry_date, note, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (user_id, entry_date)
     DO UPDATE SET
       weight_kg = EXCLUDED.weight_kg,
       note = EXCLUDED.note,
       updated_at = NOW()
     RETURNING id, user_id as "userId", weight_kg::float as "weightKg", entry_date::text as "entryDate", note, created_at as "createdAt", updated_at as "updatedAt"`,
    [userId, weightKg, normalizedDate, note ? String(note).slice(0, 255) : null]
  );
  return result.rows[0];
}

/** Returns recent weight entries for the user, newest-first. The limit is
 *  clamped to the range [1, 365] and defaults to 90. */
async function getWeightEntries({ userId, limit = 90 }: { userId: number; limit?: number }) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(365, Number(limit))) : 90;
  const result = await pool.query(
    `SELECT id, user_id as "userId", weight_kg::float as "weightKg", entry_date::text as "entryDate", note, created_at as "createdAt", updated_at as "updatedAt"
     FROM weight_entries
     WHERE user_id = $1
     ORDER BY entry_date DESC
     LIMIT $2`,
    [userId, safeLimit]
  );
  return result.rows;
}

/** Fetches weight data points over the last N days (clamped to [7, 365],
 *  default 30) in ascending date order, then computes summary stats: entry
 *  count, latest weight, starting weight, and net change in kg. */
async function getWeightTrend({ userId, days = 30 }: { userId: number; days?: number }) {
  const safeDays = Number.isFinite(days) ? Math.max(7, Math.min(365, Number(days))) : 30;
  const result = await pool.query(
    `SELECT id, weight_kg::float as "weightKg", entry_date::text as "entryDate", note
     FROM weight_entries
     WHERE user_id = $1
       AND entry_date >= (CURRENT_DATE - ($2 * INTERVAL '1 day'))
     ORDER BY entry_date ASC`,
    [userId, safeDays]
  );

  const points = result.rows;
  const latest = points.length > 0 ? points[points.length - 1] : null;
  const first = points.length > 0 ? points[0] : null;
  const changeKg = latest && first ? Number((latest.weightKg - first.weightKg).toFixed(2)) : 0;

  return {
    days: safeDays,
    points,
    stats: {
      count: points.length,
      latestKg: latest ? latest.weightKg : null,
      startKg: first ? first.weightKg : null,
      changeKg
    }
  };
}

/** Deletes a single weight entry by ID, scoped to the user for safety.
 *  Returns true if a row was deleted, false if the entry was not found. */
async function deleteWeightEntry({ userId, id }: { userId: number; id: number | string }) {
  const result = await pool.query(
    'DELETE FROM weight_entries WHERE user_id = $1 AND id = $2 RETURNING id',
    [userId, id]
  );
  return (result.rowCount ?? 0) > 0;
}

/** Creates a meal record and inserts each item in the foods array into
 *  meal_foods. Timestamp defaults to now. Returns the meal with its foods
 *  array (may be empty if no foods were provided). */
async function addMeal({ userId, name, foods, timestamp }: { userId: number; name: string; foods?: MealFood[]; timestamp?: string }) {
  const ts = timestamp ? new Date(timestamp) : new Date();

  const mealResult = await pool.query(
    'INSERT INTO meals (user_id, name, timestamp) VALUES ($1, $2, $3) RETURNING id, name, timestamp',
    [userId, name, ts]
  );

  const mealId = mealResult.rows[0].id;

  if (foods && Array.isArray(foods)) {
    for (const food of foods) {
      await pool.query(
        'INSERT INTO meal_foods (meal_id, food_name, calories, protein, carbs, fat) VALUES ($1, $2, $3, $4, $5, $6)',
        [mealId, food.foodName, food.calories, food.protein, food.carbs, food.fat]
      );
    }
  }

  return {
    id: mealId,
    name: mealResult.rows[0].name,
    foods: foods || [],
    timestamp: mealResult.rows[0].timestamp
  };
}

/** Fetches all meals for the user with their associated food items via a
 *  LEFT JOIN and json_agg aggregation. Results are newest-first. Accepts an
 *  optional `since` ISO timestamp to filter by meal timestamp. */
async function getMeals({ userId, since }: { userId: number; since?: string } = { userId: 0 }) {
  let query = `
    SELECT m.id, m.name, m.timestamp,
           json_agg(json_build_object('foodName', mf.food_name, 'calories', mf.calories, 'protein', mf.protein, 'carbs', mf.carbs, 'fat', mf.fat))
           FILTER (WHERE mf.id IS NOT NULL) as foods
    FROM meals m
    LEFT JOIN meal_foods mf ON m.id = mf.meal_id
    WHERE m.user_id = $1
  `;
  const values: (number | Date)[] = [userId];

  if (since) {
    query += ' AND m.timestamp >= $2';
    values.push(new Date(since));
  }

  query += ' GROUP BY m.id, m.name, m.timestamp ORDER BY m.timestamp DESC';

  const result = await pool.query(query, values);
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    timestamp: row.timestamp,
    foods: row.foods || []
  }));
}

/** Updates the name and/or food items of an existing meal. When foods are
 *  provided, all existing meal_foods rows are deleted and replaced. Throws
 *  if the meal is not found or not owned by the user. */
async function updateMeal({ userId, id, name, foods }: { userId: number; id: number | string; name?: string; foods?: MealFood[] }) {
  if (name !== undefined) {
    await pool.query('UPDATE meals SET name = $1 WHERE id = $2 AND user_id = $3', [name, id, userId]);
  }

  if (foods !== undefined) {
    await pool.query('DELETE FROM meal_foods WHERE meal_id = $1 AND meal_id IN (SELECT id FROM meals WHERE user_id = $2)', [id, userId]);
    for (const food of foods) {
      await pool.query(
        'INSERT INTO meal_foods (meal_id, food_name, calories, protein, carbs, fat) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, food.foodName, food.calories, food.protein, food.carbs, food.fat]
      );
    }
  }

  const result = await pool.query(
    `SELECT m.id, m.name, m.timestamp,
            json_agg(json_build_object('foodName', mf.food_name, 'calories', mf.calories, 'protein', mf.protein, 'carbs', mf.carbs, 'fat', mf.fat))
            FILTER (WHERE mf.id IS NOT NULL) as foods
     FROM meals m
     LEFT JOIN meal_foods mf ON m.id = mf.meal_id
     WHERE m.id = $1 AND m.user_id = $2
     GROUP BY m.id, m.name, m.timestamp`,
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Meal not found');
  }

  return {
    id: result.rows[0].id,
    name: result.rows[0].name,
    timestamp: result.rows[0].timestamp,
    foods: result.rows[0].foods || []
  };
}

/** Deletes a meal (and its cascade-deleted meal_foods) by ID scoped to the
 *  user. Throws if the meal is not found. Returns a confirmation message
 *  with the deleted meal row. */
async function deleteMeal({ userId, id }: { userId: number; id: number | string }) {
  const result = await pool.query('DELETE FROM meals WHERE user_id = $1 AND id = $2 RETURNING *', [userId, id]);
  if (result.rows.length === 0) {
    throw new Error('Meal not found');
  }
  return { message: 'Meal deleted', meal: result.rows[0] };
}

/** Inserts a standalone food entry (not attached to a meal) with its macro
 *  values. Timestamp defaults to now. Returns the created row. */
async function addFoodEntry({ userId, foodName, calories, protein, carbs, fat, timestamp }: { userId: number; foodName: string; calories?: number; protein?: number; carbs?: number; fat?: number; timestamp?: string }) {
  const ts = timestamp ? new Date(timestamp) : new Date();
  const result = await pool.query(
    'INSERT INTO food_entries (user_id, food_name, calories, protein, carbs, fat, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, food_name as "foodName", calories, protein, carbs, fat, timestamp',
    [userId, foodName, calories, protein, carbs, fat, ts]
  );
  return result.rows[0];
}

/** Returns all standalone food entries for the user ordered newest-first.
 *  Optionally filters to entries at or after the given ISO `since` datetime. */
async function getFoodEntries({ userId, since }: { userId: number; since?: string } = { userId: 0 }) {
  let query = 'SELECT id, food_name as "foodName", calories, protein, carbs, fat, timestamp FROM food_entries WHERE user_id = $1';
  const values: (number | Date)[] = [userId];

  if (since) {
    query += ' AND timestamp >= $2';
    values.push(new Date(since));
  }

  query += ' ORDER BY timestamp DESC';
  const result = await pool.query(query, values);
  return result.rows;
}

/** Deletes a standalone food entry by ID scoped to the user. Throws if the
 *  entry is not found. Returns a confirmation message with the deleted row. */
async function deleteFoodEntry({ userId, id }: { userId: number; id: number | string }) {
  const result = await pool.query('DELETE FROM food_entries WHERE user_id = $1 AND id = $2 RETURNING *', [userId, id]);
  if (result.rows.length === 0) {
    throw new Error('Food entry not found');
  }
  return { message: 'Food entry deleted', entry: result.rows[0] };
}

/** Aggregates macro totals from meal_foods for the given period (daily,
 *  weekly, or monthly). Daily returns absolute totals; weekly returns daily
 *  averages over elapsed days. Throws for unrecognized period strings. */
async function getMacroSummary({ userId, period = 'daily' }: { userId: number; period?: string } = { userId: 0 }) {
  const now = new Date();
  let start: Date;

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

  const result = await pool.query(
    `SELECT
       COALESCE(SUM(COALESCE(mf.calories, 0)), 0)::INTEGER as total_calories,
       COALESCE(SUM(COALESCE(mf.protein, 0)), 0)::FLOAT as total_protein,
       COALESCE(SUM(COALESCE(mf.carbs, 0)), 0)::FLOAT as total_carbs,
       COALESCE(SUM(COALESCE(mf.fat, 0)), 0)::FLOAT as total_fat,
       COUNT(DISTINCT m.id)::INTEGER as entry_count
     FROM meals m
     LEFT JOIN meal_foods mf ON m.id = mf.meal_id
     WHERE m.user_id = $1 AND m.timestamp >= $2`,
    [userId, start]
  );

  const totals = result.rows[0];

  // For weekly, calculate daily averages
  if (period === 'weekly') {
    const daysSinceStart = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return {
      period,
      start: start.toISOString(),
      avgCalories: Math.round(totals.total_calories / daysSinceStart),
      avgProtein: Math.round(totals.total_protein / daysSinceStart),
      avgCarbs: Math.round(totals.total_carbs / daysSinceStart),
      avgFat: Math.round(totals.total_fat / daysSinceStart),
      days: daysSinceStart,
      entryCount: totals.entry_count
    };
  }

  // For daily, return totals
  return {
    period,
    start: start.toISOString(),
    totalCalories: totals.total_calories,
    totalProtein: totals.total_protein,
    totalCarbs: totals.total_carbs,
    totalFat: totals.total_fat,
    entryCount: totals.entry_count
  };
}

export default {
  addWaterEntry,
  listEntries,
  sumForPeriod,
  resetWaterEntries,
  upsertWeightEntry,
  getWeightEntries,
  getWeightTrend,
  deleteWeightEntry,
  addFoodEntry,
  getFoodEntries,
  deleteFoodEntry,
  getMacroSummary,
  addMeal,
  getMeals,
  updateMeal,
  deleteMeal
};
