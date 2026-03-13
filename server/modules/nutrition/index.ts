import express, { Request, Response } from 'express';
import service from './service.js';
import calorieninjas from './calorieninjas.js';

const router = express.Router();

/** Extracts the authenticated user's ID from the request object, which is
 *  attached by the requireAuth middleware before these handlers run. */
function getUserId(req: Request): number {
  return (req as any).user.id;
}

/** GET /status — Health check confirming the nutrition module is loaded. */
// GET /api/nutrition/status
router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'nutrition', status: 'ok', info: 'Nutrition module ready' });
});

/** POST /water — Records a water intake entry for the authenticated user.
 *  Requires a positive numeric volumeMl; timestamp defaults to now.
 *  Returns 201 with the created entry. */
// POST /api/nutrition/water
// body: { volumeMl: number, timestamp?: ISOString }
router.post('/water', async (req: Request, res: Response) => {
  try {
    const { volumeMl, timestamp } = req.body;
    if (!volumeMl || isNaN(volumeMl) || Number(volumeMl) <= 0) {
      return res.status(400).json({ error: 'volumeMl must be a positive number' });
    }
    const entry = await service.addWaterEntry({ userId: getUserId(req), volumeMl: Number(volumeMl), timestamp });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /water/entries — Returns all water intake entries for the user,
 *  ordered newest-first. Accepts an optional `since` ISO timestamp query
 *  param to filter entries after a specific point in time. */
// GET /api/nutrition/water/entries
// optional query: since=ISOString
router.get('/water/entries', async (req: Request, res: Response) => {
  const { since } = req.query;
  try {
    const list = await service.listEntries({ userId: getUserId(req), since: since as string | undefined });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /water/summary — Returns the total water intake for the current
 *  daily, weekly, or monthly period. Defaults to daily. Returns 400 for
 *  invalid period values. */
// GET /api/nutrition/water/summary?period=daily|weekly|monthly
router.get('/water/summary', async (req: Request, res: Response) => {
  const { period = 'daily' } = req.query;
  try {
    const summary = await service.sumForPeriod({ userId: getUserId(req), period: String(period) });
    res.json(summary);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

/** DELETE /water/reset — Deletes all water intake entries for the user.
 *  Returns the count of deleted rows. */
// DELETE /api/nutrition/water/reset
router.delete('/water/reset', async (req: Request, res: Response) => {
  try {
    const result = await service.resetWaterEntries({ userId: getUserId(req) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /weight — Records or updates a body-weight entry for the user.
 *  Upserts on (user_id, entryDate) so re-logging the same date overwrites
 *  the previous value. entryDate defaults to today. Returns 201. */
// POST /api/nutrition/weight
// body: { weightKg: number, entryDate?: YYYY-MM-DD, note?: string }
router.post('/weight', async (req: Request, res: Response) => {
  try {
    const { weightKg, entryDate, note } = req.body || {};
    if (!weightKg || isNaN(weightKg) || Number(weightKg) <= 0) {
      return res.status(400).json({ error: 'weightKg must be a positive number' });
    }

    const created = await service.upsertWeightEntry({
      userId: getUserId(req),
      weightKg: Number(weightKg),
      entryDate,
      note
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /weight/entries — Returns recent weight entries for the user, newest
 *  first. The `limit` query param (default 90, max 365) controls how many
 *  records are returned. */
// GET /api/nutrition/weight/entries?limit=90
router.get('/weight/entries', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const entries = await service.getWeightEntries({
      userId: getUserId(req),
      limit: limit ? Number(limit) : 90
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /weight/trend — Returns weight data points over the specified window
 *  (default 30 days, clamped to 7–365) plus summary stats including the
 *  latest weight, starting weight, and net change. */
// GET /api/nutrition/weight/trend?days=30
router.get('/weight/trend', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const trend = await service.getWeightTrend({
      userId: getUserId(req),
      days: days ? Number(days) : 30
    });
    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** DELETE /weight/:id — Removes a single weight entry by ID. Returns 404
 *  if the entry is not found or does not belong to the current user. */
// DELETE /api/nutrition/weight/:id
router.delete('/weight/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteWeightEntry({ userId: getUserId(req), id });
    if (!deleted) {
      return res.status(404).json({ error: 'Weight entry not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /search — Searches the CalorieNinjas API for nutrition data matching
 *  the `q` query string. Returns a list of food items with macro information.
 *  Requires the CALORIENINJAS_API_KEY environment variable to be set. */
// GET /api/nutrition/search?q=chicken
router.get('/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'query required' });
  try {
    const results = await calorieninjas.searchInstant(String(q));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /foods — Logs a standalone food entry with its macro breakdown
 *  (calories, protein, carbs, fat). Timestamp defaults to now. Returns 201
 *  with the created entry. */
// POST /api/nutrition/foods (user submits a food with calorie/macro info)
router.post('/foods', async (req: Request, res: Response) => {
  const { foodName, calories, protein, carbs, fat, timestamp } = req.body;
  try {
    const entry = await service.addFoodEntry({ userId: getUserId(req), foodName, calories, protein, carbs, fat, timestamp });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /foods — Returns all food entries for the user, newest-first.
 *  Accepts an optional `since` ISO timestamp query param to filter results. */
// GET /api/nutrition/foods
router.get('/foods', async (req: Request, res: Response) => {
  const { since } = req.query;
  try {
    const entries = await service.getFoodEntries({ userId: getUserId(req), since: since as string | undefined });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** DELETE /foods/:id — Removes a single food entry by ID. Returns 404 if
 *  the entry is not found or does not belong to the current user. */
// DELETE /api/nutrition/foods/:id
router.delete('/foods/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await service.deleteFoodEntry({ userId: getUserId(req), id });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

/** GET /foods/summary — Aggregates macro totals (calories, protein, carbs,
 *  fat) across meal_foods for the current period (daily, weekly, monthly).
 *  Weekly results include daily averages; daily returns totals. */
// GET /api/nutrition/foods/summary
router.get('/foods/summary', async (req: Request, res: Response) => {
  const { period = 'daily' } = req.query;
  try {
    const summary = await service.getMacroSummary({ userId: getUserId(req), period: String(period) });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /meals — Creates a named meal and inserts its food items into
 *  meal_foods. Both `name` and a non-empty `foods` array are required.
 *  Returns 201 with the full meal including its foods. */
// POST /api/nutrition/meals
// body: { name: string, foods: [{foodName, calories, protein, carbs, fat}], timestamp?: ISOString }
router.post('/meals', async (req: Request, res: Response) => {
  try {
    const { name, foods, timestamp } = req.body;
    if (!name || !foods || !Array.isArray(foods)) {
      return res.status(400).json({ error: 'name and foods array required' });
    }
    const meal = await service.addMeal({ userId: getUserId(req), name, foods, timestamp });
    res.status(201).json(meal);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /meals — Returns all meals for the user with their food items,
 *  newest-first. Accepts an optional `since` ISO timestamp query param. */
// GET /api/nutrition/meals
router.get('/meals', async (req: Request, res: Response) => {
  const { since } = req.query;
  try {
    const meals = await service.getMeals({ userId: getUserId(req), since: since as string | undefined });
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** PUT /meals/:id — Updates a meal's name and/or replaces its food items.
 *  When foods are provided, existing meal_foods rows are deleted and
 *  re-inserted. Returns 404 if the meal is not found. */
// PUT /api/nutrition/meals/:id
router.put('/meals/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, foods } = req.body;
  try {
    const updated = await service.updateMeal({ userId: getUserId(req), id, name, foods });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

/** DELETE /meals/:id — Removes a meal and its associated food items.
 *  Returns 404 if the meal is not found or not owned by the current user. */
// DELETE /api/nutrition/meals/:id
router.delete('/meals/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await service.deleteMeal({ userId: getUserId(req), id });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

/** POST /tdee — Calculates BMR and TDEE using the Mifflin-St Jeor equation
 *  and returns calorie targets for maintenance and various weight-loss rates,
 *  plus recommended macro splits. All five body fields are required. */
// POST /api/nutrition/tdee
// body: { age, sex, height_cm, weight_kg, activity_level }
router.post('/tdee', async (req: Request, res: Response) => {
  try {
    const { age, sex, height_cm, weight_kg, activity_level } = req.body;

    if (!age || !sex || !height_cm || !weight_kg || !activity_level) {
      return res.status(400).json({ error: 'Missing required fields: age, sex, height_cm, weight_kg, activity_level' });
    }

    const ageN = Number(age);
    const heightN = Number(height_cm);
    const weightN = Number(weight_kg);
    const activityN = Number(activity_level);

    if (!Number.isFinite(ageN) || ageN < 10 || ageN > 120) {
      return res.status(400).json({ error: 'age must be between 10 and 120' });
    }
    if (sex !== 'male' && sex !== 'female') {
      return res.status(400).json({ error: 'sex must be male or female' });
    }
    if (!Number.isFinite(heightN) || heightN < 50 || heightN > 300) {
      return res.status(400).json({ error: 'height_cm must be between 50 and 300' });
    }
    if (!Number.isFinite(weightN) || weightN < 20 || weightN > 500) {
      return res.status(400).json({ error: 'weight_kg must be between 20 and 500' });
    }
    if (!Number.isFinite(activityN) || activityN < 1.0 || activityN > 2.5) {
      return res.status(400).json({ error: 'activity_level must be between 1.0 and 2.5' });
    }

    const result = await calorieninjas.calculateTDEE({
      age: ageN,
      sex,
      height_cm: heightN,
      weight_kg: weightN,
      activity_level: activityN
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate TDEE' });
  }
});

export default router;
