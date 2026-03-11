// @ts-check
import express from 'express';
import service from './service.js';
import calorieninjas from './calorieninjas.js';

/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {Request & { user: import('../../types').User }} AuthedRequest */

const router = express.Router();

/**
 * @param {Request} req
 * @returns {number}
 */
function getUserId(req) {
  return /** @type {AuthedRequest} */ (req).user.id;
}

// GET /api/nutrition/status
/** @param {AuthedRequest} req @param {Response} res */
router.get('/status', (req, res) => {
  res.json({ module: 'nutrition', status: 'ok', info: 'Nutrition module ready' });
});

// POST /api/nutrition/water
// body: { volumeMl: number, timestamp?: ISOString }
/** @param {AuthedRequest} req @param {Response} res */
router.post('/water', async (req, res) => {
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

// GET /api/nutrition/water/entries
// optional query: since=ISOString
/** @param {AuthedRequest} req @param {Response} res */
router.get('/water/entries', async (req, res) => {
  const { since } = req.query;
  try {
    const list = await service.listEntries({ userId: getUserId(req), since });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/nutrition/water/summary?period=daily|weekly|monthly
/** @param {AuthedRequest} req @param {Response} res */
router.get('/water/summary', async (req, res) => {
  const { period = 'daily' } = req.query;
  try {
    const summary = await /** @type {any} */ (service).sumForPeriod({ userId: getUserId(req), period: String(period) });
    res.json(summary);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// DELETE /api/nutrition/water/reset
/** @param {AuthedRequest} req @param {Response} res */
router.delete('/water/reset', async (req, res) => {
  try {
    const result = await service.resetWaterEntries({ userId: getUserId(req) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/nutrition/weight
// body: { weightKg: number, entryDate?: YYYY-MM-DD, note?: string }
/** @param {AuthedRequest} req @param {Response} res */
router.post('/weight', async (req, res) => {
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

// GET /api/nutrition/weight/entries?limit=90
/** @param {AuthedRequest} req @param {Response} res */
router.get('/weight/entries', async (req, res) => {
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

// GET /api/nutrition/weight/trend?days=30
/** @param {AuthedRequest} req @param {Response} res */
router.get('/weight/trend', async (req, res) => {
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

// DELETE /api/nutrition/weight/:id
/** @param {AuthedRequest} req @param {Response} res */
router.delete('/weight/:id', async (req, res) => {
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

// POST /api/nutrition/search?q=chicken
/** @param {AuthedRequest} req @param {Response} res */
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'query required' });
  try {
    const results = await calorieninjas.searchInstant(String(q));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/nutrition/foods (user submits a food with calorie/macro info)
/** @param {AuthedRequest} req @param {Response} res */
router.post('/foods', async (req, res) => {
  const { foodName, calories, protein, carbs, fat, timestamp } = req.body;
  try {
    const entry = await service.addFoodEntry({ userId: getUserId(req), foodName, calories, protein, carbs, fat, timestamp });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/nutrition/foods
/** @param {AuthedRequest} req @param {Response} res */
router.get('/foods', async (req, res) => {
  const { since } = req.query;
  try {
    const entries = await service.getFoodEntries({ userId: getUserId(req), since });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/nutrition/foods/:id
/** @param {AuthedRequest} req @param {Response} res */
router.delete('/foods/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await service.deleteFoodEntry({ userId: getUserId(req), id });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

// GET /api/nutrition/foods/summary
/** @param {AuthedRequest} req @param {Response} res */
router.get('/foods/summary', async (req, res) => {
  const { period = 'daily' } = req.query;
  try {
    const summary = await /** @type {any} */ (service).getMacroSummary({ userId: getUserId(req), period: String(period) });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/nutrition/meals
// body: { name: string, foods: [{foodName, calories, protein, carbs, fat}], timestamp?: ISOString }
/** @param {AuthedRequest} req @param {Response} res */
router.post('/meals', async (req, res) => {
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

// GET /api/nutrition/meals
/** @param {AuthedRequest} req @param {Response} res */
router.get('/meals', async (req, res) => {
  const { since } = req.query;
  try {
    const meals = await service.getMeals({ userId: getUserId(req), since });
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/nutrition/meals/:id
/** @param {AuthedRequest} req @param {Response} res */
router.put('/meals/:id', async (req, res) => {
  const { id } = req.params;
  const { name, foods } = req.body;
  try {
    const updated = await service.updateMeal({ userId: getUserId(req), id, name, foods });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

// DELETE /api/nutrition/meals/:id
/** @param {AuthedRequest} req @param {Response} res */
router.delete('/meals/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await service.deleteMeal({ userId: getUserId(req), id });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

// POST /api/nutrition/tdee
// body: { age, sex, height_cm, weight_kg, activity_level }
/** @param {AuthedRequest} req @param {Response} res */
router.post('/tdee', async (req, res) => {
  try {
    const { age, sex, height_cm, weight_kg, activity_level } = req.body;
    console.log('TDEE request:', { age, sex, height_cm, weight_kg, activity_level });
    
    if (!age || !sex || !height_cm || !weight_kg || !activity_level) {
      console.log('Missing fields');
      return res.status(400).json({ error: 'Missing required fields: age, sex, height_cm, weight_kg, activity_level' });
    }

    const result = await calorieninjas.calculateTDEE({
      age: Number(age),
      sex,
      height_cm: Number(height_cm),
      weight_kg: Number(weight_kg),
      activity_level: Number(activity_level)
    });

    console.log('TDEE result:', result);
    res.json(result);
  } catch (err) {
    console.error('TDEE error:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
