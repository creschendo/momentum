import express from 'express';
import service from './service.js';
import calorieninjas from './calorieninjas.js';

const router = express.Router();

// GET /api/nutrition/status
router.get('/status', (req, res) => {
  res.json({ module: 'nutrition', status: 'ok', info: 'Nutrition module ready' });
});

// POST /api/nutrition/water
// body: { volumeMl: number, timestamp?: ISOString }
router.post('/water', (req, res) => {
  try {
    const { volumeMl, timestamp } = req.body;
    if (!volumeMl || isNaN(volumeMl) || Number(volumeMl) <= 0) {
      return res.status(400).json({ error: 'volumeMl must be a positive number' });
    }
    const entry = service.addWaterEntry({ volumeMl: Number(volumeMl), timestamp });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/nutrition/water/entries
// optional query: since=ISOString
router.get('/water/entries', (req, res) => {
  const { since } = req.query;
  try {
    const list = service.listEntries({ since });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/nutrition/water/summary?period=daily|weekly|monthly
router.get('/water/summary', (req, res) => {
  const { period = 'daily' } = req.query;
  try {
    const summary = service.sumForPeriod(period);
    res.json(summary);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// DELETE /api/nutrition/water/reset
router.delete('/water/reset', (req, res) => {
  try {
    const result = service.resetWaterEntries();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/nutrition/search?q=chicken
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'query required' });
  try {
    const results = await calorieninjas.searchInstant(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/nutrition/foods (user submits a food with calorie/macro info)
router.post('/foods', (req, res)  => {
  const { foodName, calories, protein, carbs, fat, timestamp } = req.body;
  const entry = service.addFoodEntry({ foodName, calories, protein, carbs, fat, timestamp });
  res.status(201).json(entry);
});

// GET /api/nutrition/foods
router.get('/foods', (req, res) => {
  const { since } = req.query;
  try {
    const entries = service.getFoodEntries({ since });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/nutrition/foods/:id
router.delete('/foods/:id', (req, res) => {
  const { id } = req.params;
  try {
    const result = service.deleteFoodEntry(id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

// GET /api/nutrition/foods/summary
router.get('/foods/summary',  (req, res) => {
  const { period = 'daily' } = req.query;
  const summary = service.getMacroSummary(period);
  res.json(summary);
});

// POST /api/nutrition/meals
// body: { name: string, foods: [{foodName, calories, protein, carbs, fat}], timestamp?: ISOString }
router.post('/meals', (req, res) => {
  try {
    const { name, foods, timestamp } = req.body;
    if (!name || !foods || !Array.isArray(foods)) {
      return res.status(400).json({ error: 'name and foods array required' });
    }
    const meal = service.addMeal({ name, foods, timestamp });
    res.status(201).json(meal);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/nutrition/meals
router.get('/meals', (req, res) => {
  const { since } = req.query;
  try {
    const meals = service.getMeals({ since });
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/nutrition/meals/:id
router.put('/meals/:id', (req, res) => {
  const { id } = req.params;
  const { name, foods } = req.body;
  try {
    const updated = service.updateMeal(id, { name, foods });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

// DELETE /api/nutrition/meals/:id
router.delete('/meals/:id', (req, res) => {
  const { id } = req.params;
  try {
    const result = service.deleteMeal(id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

// POST /api/nutrition/tdee
// body: { age, sex, height_cm, weight_kg, activity_level }
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
