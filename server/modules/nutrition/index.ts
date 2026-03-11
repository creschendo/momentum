import express, { Request, Response } from 'express';
import service from './service.js';
import calorieninjas from './calorieninjas.js';

const router = express.Router();

function getUserId(req: Request): number {
  return (req as any).user.id;
}

// GET /api/nutrition/status
router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'nutrition', status: 'ok', info: 'Nutrition module ready' });
});

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

// DELETE /api/nutrition/water/reset
router.delete('/water/reset', async (req: Request, res: Response) => {
  try {
    const result = await service.resetWaterEntries({ userId: getUserId(req) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

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

// POST /api/nutrition/tdee
// body: { age, sex, height_cm, weight_kg, activity_level }
router.post('/tdee', async (req: Request, res: Response) => {
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
