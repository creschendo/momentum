import pool from '../../db.js';

// Water entry functions
async function addWaterEntry({ volumeMl, timestamp }) {
  const ts = timestamp ? new Date(timestamp) : new Date();
  const result = await pool.query(
    'INSERT INTO water_entries (volume_ml, timestamp) VALUES ($1, $2) RETURNING id, volume_ml as "volumeMl", timestamp',
    [volumeMl, ts]
  );
  return result.rows[0];
}

async function listEntries({ since } = {}) {
  let query = 'SELECT id, volume_ml as "volumeMl", timestamp FROM water_entries';
  const values = [];
  
  if (since) {
    query += ' WHERE timestamp >= $1';
    values.push(new Date(since));
  }
  
  query += ' ORDER BY timestamp DESC';
  const result = await pool.query(query, values);
  return result.rows;
}

async function sumForPeriod(period = 'daily') {
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
  
  const result = await pool.query(
    'SELECT COALESCE(SUM(volume_ml), 0) as total FROM water_entries WHERE timestamp >= $1',
    [start]
  );
  
  const total = Number(result.rows[0].total) || 0;
  return { period, start: start.toISOString(), totalMl: total };
}

async function resetWaterEntries() {
  const result = await pool.query('DELETE FROM water_entries');
  return { message: 'Water entries reset', count: result.rowCount };
}

// Meal functions
async function addMeal({ name, foods, timestamp }) {
  const ts = timestamp ? new Date(timestamp) : new Date();
  
  // Insert meal and get ID
  const mealResult = await pool.query(
    'INSERT INTO meals (name, timestamp) VALUES ($1, $2) RETURNING id, name, timestamp',
    [name, ts]
  );
  
  const mealId = mealResult.rows[0].id;
  
  // Insert foods for this meal
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

async function getMeals({ since } = {}) {
  let query = `
    SELECT m.id, m.name, m.timestamp,
           json_agg(json_build_object('foodName', mf.food_name, 'calories', mf.calories, 'protein', mf.protein, 'carbs', mf.carbs, 'fat', mf.fat)) 
           FILTER (WHERE mf.id IS NOT NULL) as foods
    FROM meals m
    LEFT JOIN meal_foods mf ON m.id = mf.meal_id
  `;
  const values = [];
  
  if (since) {
    query += ' WHERE m.timestamp >= $1';
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

async function updateMeal(id, { name, foods }) {
  // Update meal name if provided
  if (name !== undefined) {
    await pool.query('UPDATE meals SET name = $1 WHERE id = $2', [name, id]);
  }
  
  // Delete old foods and insert new ones if provided
  if (foods !== undefined) {
    await pool.query('DELETE FROM meal_foods WHERE meal_id = $1', [id]);
    for (const food of foods) {
      await pool.query(
        'INSERT INTO meal_foods (meal_id, food_name, calories, protein, carbs, fat) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, food.foodName, food.calories, food.protein, food.carbs, food.fat]
      );
    }
  }
  
  // Return updated meal
  const result = await pool.query(
    `SELECT m.id, m.name, m.timestamp,
            json_agg(json_build_object('foodName', mf.food_name, 'calories', mf.calories, 'protein', mf.protein, 'carbs', mf.carbs, 'fat', mf.fat)) 
            FILTER (WHERE mf.id IS NOT NULL) as foods
     FROM meals m
     LEFT JOIN meal_foods mf ON m.id = mf.meal_id
     WHERE m.id = $1
     GROUP BY m.id, m.name, m.timestamp`,
    [id]
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

async function deleteMeal(id) {
  const result = await pool.query('DELETE FROM meals WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) {
    throw new Error('Meal not found');
  }
  return { message: 'Meal deleted', meal: result.rows[0] };
}

// Food entry functions
async function addFoodEntry({ foodName, calories, protein, carbs, fat, timestamp }) {
  const ts = timestamp ? new Date(timestamp) : new Date();
  const result = await pool.query(
    'INSERT INTO food_entries (food_name, calories, protein, carbs, fat, timestamp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, food_name as "foodName", calories, protein, carbs, fat, timestamp',
    [foodName, calories, protein, carbs, fat, ts]
  );
  return result.rows[0];
}

async function getFoodEntries({ since } = {}) {
  let query = 'SELECT id, food_name as "foodName", calories, protein, carbs, fat, timestamp FROM food_entries';
  const values = [];
  
  if (since) {
    query += ' WHERE timestamp >= $1';
    values.push(new Date(since));
  }
  
  query += ' ORDER BY timestamp DESC';
  const result = await pool.query(query, values);
  return result.rows;
}

async function deleteFoodEntry(id) {
  const result = await pool.query('DELETE FROM food_entries WHERE id = $1 RETURNING *', [id]);
  if (result.rows.length === 0) {
    throw new Error('Food entry not found');
  }
  return { message: 'Food entry deleted', entry: result.rows[0] };
}

async function getMacroSummary(period = 'daily') {
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

  const result = await pool.query(
    `SELECT 
       COALESCE(SUM(COALESCE(mf.calories, 0)), 0)::INTEGER as total_calories,
       COALESCE(SUM(COALESCE(mf.protein, 0)), 0)::FLOAT as total_protein,
       COALESCE(SUM(COALESCE(mf.carbs, 0)), 0)::FLOAT as total_carbs,
       COALESCE(SUM(COALESCE(mf.fat, 0)), 0)::FLOAT as total_fat,
       COUNT(DISTINCT m.id)::INTEGER as entry_count
     FROM meals m
     LEFT JOIN meal_foods mf ON m.id = mf.meal_id
     WHERE m.timestamp >= $1`,
    [start]
  );

  const totals = result.rows[0];

  // For weekly, calculate daily averages
  if (period === 'weekly') {
    const daysSinceStart = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
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
  addFoodEntry, 
  getFoodEntries, 
  deleteFoodEntry, 
  getMacroSummary,
  addMeal,
  getMeals,
  updateMeal,
  deleteMeal
};
