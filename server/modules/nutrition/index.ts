import express, { Request, Response } from 'express';
import { z } from 'zod';
import service from './service.js';
import calorieninjas from './calorieninjas.js';
import { validate } from '../../lib/validate.js';

const router = express.Router();

/** Extracts the authenticated user's ID from the request object, which is
 *  attached by the requireAuth middleware before these handlers run. */
function getUserId(req: Request): number {
  return (req as any).user.id;
}

const WaterBody = z.object({
  volumeMl: z.number().positive('volumeMl must be a positive number'),
  timestamp: z.string().optional()
});

const WeightBody = z.object({
  weightKg: z.number().positive('weightKg must be a positive number'),
  entryDate: z.string().optional(),
  note: z.string().optional()
});

const FoodBody = z.object({
  foodName: z.string().min(1),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  timestamp: z.string().optional()
});

const MealBody = z.object({
  name: z.string().min(1),
  foods: z.array(z.object({
    foodName: z.string(),
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional()
  })).min(1, 'foods array must not be empty'),
  timestamp: z.string().optional()
});

const MealUpdateBody = z.object({
  name: z.string().optional(),
  foods: z.array(z.object({
    foodName: z.string(),
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional()
  })).optional()
});

const TdeeBody = z.object({
  age: z.number().int().min(10).max(120),
  sex: z.enum(['male', 'female']),
  height_cm: z.number().min(50).max(300),
  weight_kg: z.number().min(20).max(500),
  activity_level: z.number().min(1.0).max(2.5)
});

/** GET /status — Health check confirming the nutrition module is loaded. */
router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'nutrition', status: 'ok', info: 'Nutrition module ready' });
});

/** POST /water — Records a water intake entry for the authenticated user. */
router.post('/water', async (req: Request, res: Response) => {
  const body = validate(WaterBody, req.body, res);
  if (!body) return;
  try {
    const entry = await service.addWaterEntry({ userId: getUserId(req), volumeMl: body.volumeMl, timestamp: body.timestamp });
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /water/entries — Returns water intake entries for the user. Accepts ?limit (default 100, max 500). */
router.get('/water/entries', async (req: Request, res: Response) => {
  const { since } = req.query;
  const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
  try {
    const list = await service.listEntries({ userId: getUserId(req), since: since as string | undefined, limit });
    res.json(list);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /water/summary — Returns the total water intake for the current period. */
router.get('/water/summary', async (req: Request, res: Response) => {
  const { period = 'daily' } = req.query;
  try {
    const summary = await service.sumForPeriod({ userId: getUserId(req), period: String(period) });
    res.json(summary);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Bad request' });
  }
});

/** DELETE /water/reset — Deletes all water intake entries for the user. */
router.delete('/water/reset', async (req: Request, res: Response) => {
  try {
    const result = await service.resetWaterEntries({ userId: getUserId(req) });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /weight — Records or updates a body-weight entry for the user. */
router.post('/weight', async (req: Request, res: Response) => {
  const body = validate(WeightBody, req.body, res);
  if (!body) return;
  try {
    const created = await service.upsertWeightEntry({ userId: getUserId(req), ...body });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /weight/entries — Returns recent weight entries for the user. */
router.get('/weight/entries', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const entries = await service.getWeightEntries({ userId: getUserId(req), limit: limit ? Number(limit) : 90 });
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /weight/trend — Returns weight data points over the specified window. */
router.get('/weight/trend', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const trend = await service.getWeightTrend({ userId: getUserId(req), days: days ? Number(days) : 30 });
    res.json(trend);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /weight/:id — Removes a single weight entry by ID. */
router.delete('/weight/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteWeightEntry({ userId: getUserId(req), id });
    if (!deleted) return res.status(404).json({ error: 'Weight entry not found' });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /search — Searches the CalorieNinjas API for nutrition data. */
router.get('/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'query required' });
  try {
    const results = await calorieninjas.searchInstant(String(q));
    res.json(results);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /foods — Logs a standalone food entry with its macro breakdown. */
router.post('/foods', async (req: Request, res: Response) => {
  const body = validate(FoodBody, req.body, res);
  if (!body) return;
  try {
    const entry = await service.addFoodEntry({ userId: getUserId(req), ...body });
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /foods — Returns food entries for the user. Accepts ?limit (default 100, max 500). */
router.get('/foods', async (req: Request, res: Response) => {
  const { since } = req.query;
  const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
  try {
    const entries = await service.getFoodEntries({ userId: getUserId(req), since: since as string | undefined, limit });
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /foods/:id — Removes a single food entry by ID. */
router.delete('/foods/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await service.deleteFoodEntry({ userId: getUserId(req), id });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Not found' });
  }
});

/** GET /foods/summary — Aggregates macro totals for the current period. */
router.get('/foods/summary', async (req: Request, res: Response) => {
  const { period = 'daily' } = req.query;
  try {
    const summary = await service.getMacroSummary({ userId: getUserId(req), period: String(period) });
    res.json(summary);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /meals — Creates a named meal and inserts its food items. */
router.post('/meals', async (req: Request, res: Response) => {
  const body = validate(MealBody, req.body, res);
  if (!body) return;
  try {
    const meal = await service.addMeal({ userId: getUserId(req), ...body });
    res.status(201).json(meal);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /meals — Returns meals for the user with their food items. Accepts ?limit (default 50, max 200). */
router.get('/meals', async (req: Request, res: Response) => {
  const { since } = req.query;
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  try {
    const meals = await service.getMeals({ userId: getUserId(req), since: since as string | undefined, limit });
    res.json(meals);
  } catch (err) {
    req.log.error({ err }, `nutrition ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PUT /meals/:id — Updates a meal's name and/or replaces its food items. */
router.put('/meals/:id', async (req: Request, res: Response) => {
  const body = validate(MealUpdateBody, req.body, res);
  if (!body) return;
  const { id } = req.params;
  try {
    const updated = await service.updateMeal({ userId: getUserId(req), id, ...body });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Not found' });
  }
});

/** DELETE /meals/:id — Removes a meal and its associated food items. */
router.delete('/meals/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await service.deleteMeal({ userId: getUserId(req), id });
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Not found' });
  }
});

/** POST /tdee — Calculates BMR and TDEE using the Mifflin-St Jeor equation. */
router.post('/tdee', async (req: Request, res: Response) => {
  const body = validate(TdeeBody, req.body, res);
  if (!body) return;
  try {
    const result = await calorieninjas.calculateTDEE(body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate TDEE' });
  }
});

export default router;
