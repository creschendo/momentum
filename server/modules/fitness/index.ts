import express, { Request, Response } from 'express';
import { z } from 'zod';
import * as service from './service.js';
import { validate } from '../../lib/validate.js';

const router = express.Router();

/** Extracts the authenticated user's ID from the request object, which is
 *  populated by the requireAuth middleware prior to reaching these handlers. */
function getUserId(req: Request): number {
  return (req as any).user.id;
}

const SplitBody = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  days: z.number().int().min(0)
}).refine(b => b.name || b.title, { message: 'Name is required' });

const SplitUpdateBody = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  daysCount: z.number().int().positive().optional()
});

const DayUpdateBody = z.object({
  name: z.string().optional()
});

const LiftBody = z.object({
  exercise_name: z.string().optional(),
  sets: z.number().int().positive().optional(),
  reps: z.string().optional(),
  weight: z.number().optional()
});

const CardioBody = z.object({
  exercise_name: z.string().optional(),
  duration_minutes: z.number().int().positive().optional(),
  intensity: z.string().optional()
});

/** GET /status — Health check endpoint confirming the fitness module is loaded. */
router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'fitness', status: 'ok', info: 'Fitness module ready' });
});

/** GET /splits — Returns all workout splits for the authenticated user. */
router.get('/splits', async (req: Request, res: Response) => {
  try {
    const splits = await service.getSplits({ userId: getUserId(req) });
    res.json(splits);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /splits — Creates a new workout split. */
router.post('/splits', async (req: Request, res: Response) => {
  const body = validate(SplitBody, req.body, res);
  if (!body) return;
  try {
    const split = await service.addSplit({ userId: getUserId(req), name: body.name || body.title!, daysCount: Number(body.days) });
    res.status(201).json(split);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /splits/:id — Fetches a single split by ID. */
router.get('/splits/:id', async (req: Request, res: Response) => {
  try {
    const split = await service.getSplit({ userId: getUserId(req), id: req.params.id });
    if (!split) return res.status(404).json({ error: 'Split not found' });
    res.json(split);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PUT /splits/:id — Updates split fields. */
router.put('/splits/:id', async (req: Request, res: Response) => {
  const body = validate(SplitUpdateBody, req.body, res);
  if (!body) return;
  try {
    const split = await service.updateSplit({ userId: getUserId(req), id: req.params.id, updates: body });
    if (!split) return res.status(404).json({ error: 'Split not found' });
    res.json(split);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /splits/:id — Permanently removes the split. */
router.delete('/splits/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await service.deleteSplit({ userId: getUserId(req), id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Split not found' });
    res.json({ message: 'Split deleted' });
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /splits/:splitId/days — Appends a new day to an existing split. */
router.post('/splits/:splitId/days', async (req: Request, res: Response) => {
  try {
    const day = await service.addDayToSplit({ userId: getUserId(req), splitId: req.params.splitId, dayData: req.body });
    if (!day) return res.status(404).json({ error: 'Split not found' });
    res.status(201).json(day);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PUT /splits/:splitId/days/:dayId — Updates the name of an existing day. */
router.put('/splits/:splitId/days/:dayId', async (req: Request, res: Response) => {
  const body = validate(DayUpdateBody, req.body, res);
  if (!body) return;
  try {
    const day = await service.updateDayInSplit({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, updates: body });
    if (!day) return res.status(404).json({ error: 'Day not found' });
    res.json(day);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /splits/:splitId/days/:dayId — Removes a day from the split. */
router.delete('/splits/:splitId/days/:dayId', async (req: Request, res: Response) => {
  try {
    const deleted = await service.removeDayFromSplit({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId });
    if (!deleted) return res.status(404).json({ error: 'Day not found' });
    res.json({ message: 'Day deleted' });
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /splits/:splitId/days/:dayId/lifts — Adds a strength exercise to a day. */
router.post('/splits/:splitId/days/:dayId/lifts', async (req: Request, res: Response) => {
  const body = validate(LiftBody, req.body, res);
  if (!body) return;
  try {
    const lift = await service.addLiftToDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, lift: body });
    if (!lift) return res.status(404).json({ error: 'Split or day not found' });
    res.status(201).json(lift);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PUT /splits/:splitId/days/:dayId/lifts/:liftId — Updates a lift. */
router.put('/splits/:splitId/days/:dayId/lifts/:liftId', async (req: Request, res: Response) => {
  const body = validate(LiftBody, req.body, res);
  if (!body) return;
  try {
    const lift = await service.updateLiftInDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, liftId: req.params.liftId, updates: body });
    if (!lift) return res.status(404).json({ error: 'Lift not found' });
    res.json(lift);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /splits/:splitId/days/:dayId/lifts/:liftId — Removes a lift. */
router.delete('/splits/:splitId/days/:dayId/lifts/:liftId', async (req: Request, res: Response) => {
  try {
    const deleted = await service.removeLiftFromDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, liftId: req.params.liftId });
    if (!deleted) return res.status(404).json({ error: 'Lift not found' });
    res.json({ message: 'Lift deleted' });
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /splits/:splitId/days/:dayId/cardio — Adds a cardio exercise to a day. */
router.post('/splits/:splitId/days/:dayId/cardio', async (req: Request, res: Response) => {
  const body = validate(CardioBody, req.body, res);
  if (!body) return;
  try {
    const cardio = await service.addCardioToDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, cardio: body });
    if (!cardio) return res.status(404).json({ error: 'Split or day not found' });
    res.status(201).json(cardio);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PUT /splits/:splitId/days/:dayId/cardio/:cardioId — Updates a cardio entry. */
router.put('/splits/:splitId/days/:dayId/cardio/:cardioId', async (req: Request, res: Response) => {
  const body = validate(CardioBody, req.body, res);
  if (!body) return;
  try {
    const cardio = await service.updateCardioInDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, cardioId: req.params.cardioId, updates: body });
    if (!cardio) return res.status(404).json({ error: 'Cardio session not found' });
    res.json(cardio);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /splits/:splitId/days/:dayId/cardio/:cardioId — Removes a cardio entry. */
router.delete('/splits/:splitId/days/:dayId/cardio/:cardioId', async (req: Request, res: Response) => {
  try {
    const deleted = await service.removeCardioFromDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, cardioId: req.params.cardioId });
    if (!deleted) return res.status(404).json({ error: 'Cardio session not found' });
    res.json({ message: 'Cardio session deleted' });
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
