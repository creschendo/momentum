import express, { Request, Response } from 'express';
import * as service from './service.js';

const router = express.Router();

/** Extracts the authenticated user's ID from the request object, which is
 *  populated by the requireAuth middleware prior to reaching these handlers. */
function getUserId(req: Request): number {
  return (req as any).user.id;
}

/** GET /status — Health check endpoint confirming the fitness module is
 *  loaded and ready. */
// GET /api/fitness/status
router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'fitness', status: 'ok', info: 'Fitness module ready' });
});

/** GET /splits — Returns all workout splits for the authenticated user,
 *  each with its nested days, lifts, and cardio entries. */
// Splits CRUD
router.get('/splits', async (req: Request, res: Response) => {
  try {
    const splits = await service.getSplits({ userId: getUserId(req) });
    res.json(splits);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /splits — Creates a new workout split. Requires a name and a days
 *  count; automatically creates the corresponding day rows. Returns 201
 *  with the new split on success. */
router.post('/splits', async (req: Request, res: Response) => {
  try {
    const { title, name, days } = req.body;
    const splitName = name || title;
    if (!splitName || days === undefined || days === null) {
      return res.status(400).json({ error: 'Name and days are required' });
    }
    const split = await service.addSplit({ userId: getUserId(req), name: splitName, daysCount: Number(days) });
    res.status(201).json(split);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /splits/:id — Fetches a single split by ID with its full nested
 *  hierarchy (days, lifts, cardio). Returns 404 if not found or not owned
 *  by the current user. */
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

/** PUT /splits/:id — Updates split fields (name, description, daysCount).
 *  Adjusting daysCount will insert or delete day rows to match the new
 *  count. Returns the updated split or 404 if not found. */
router.put('/splits/:id', async (req: Request, res: Response) => {
  try {
    const split = await service.updateSplit({ userId: getUserId(req), id: req.params.id, updates: req.body });
    if (!split) return res.status(404).json({ error: 'Split not found' });
    res.json(split);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /splits/:id — Permanently removes the split and all of its
 *  associated days, lifts, and cardio entries. Returns 404 if not found. */
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

/** POST /splits/:splitId/days — Appends a new day to an existing split.
 *  The day is assigned the next sequential day number. Returns 404 if the
 *  parent split is not found. */
// Days
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

/** PUT /splits/:splitId/days/:dayId — Updates the name of an existing day
 *  within a split. Returns 404 if the day or parent split is not found. */
router.put('/splits/:splitId/days/:dayId', async (req: Request, res: Response) => {
  try {
    const day = await service.updateDayInSplit({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, updates: req.body });
    if (!day) return res.status(404).json({ error: 'Day not found' });
    res.json(day);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /splits/:splitId/days/:dayId — Removes a day and all its
 *  associated lifts and cardio from the split. Returns 404 if not found. */
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

/** POST /splits/:splitId/days/:dayId/lifts — Adds a strength exercise
 *  (exerciseName, sets, reps, weight) to a day. Verifies the day belongs
 *  to the authenticated user's split before inserting. */
// Lifts
router.post('/splits/:splitId/days/:dayId/lifts', async (req: Request, res: Response) => {
  try {
    const lift = await service.addLiftToDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, lift: req.body });
    if (!lift) return res.status(404).json({ error: 'Split or day not found' });
    res.status(201).json(lift);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PUT /splits/:splitId/days/:dayId/lifts/:liftId — Updates one or more
 *  fields of a lift (exerciseName, sets, reps, weight). Returns 404 if the
 *  lift or its parent day/split is not found. */
router.put('/splits/:splitId/days/:dayId/lifts/:liftId', async (req: Request, res: Response) => {
  try {
    const lift = await service.updateLiftInDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, liftId: req.params.liftId, updates: req.body });
    if (!lift) return res.status(404).json({ error: 'Lift not found' });
    res.json(lift);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /splits/:splitId/days/:dayId/lifts/:liftId — Removes a lift from
 *  a day. Returns 404 if the lift or its parent day/split is not found. */
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

/** POST /splits/:splitId/days/:dayId/cardio — Adds a cardio exercise
 *  (exerciseName, durationMinutes, intensity) to a day. Verifies the day
 *  belongs to the authenticated user's split before inserting. */
// Cardio
router.post('/splits/:splitId/days/:dayId/cardio', async (req: Request, res: Response) => {
  try {
    const cardio = await service.addCardioToDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, cardio: req.body });
    if (!cardio) return res.status(404).json({ error: 'Split or day not found' });
    res.status(201).json(cardio);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PUT /splits/:splitId/days/:dayId/cardio/:cardioId — Updates one or more
 *  fields of a cardio entry (exerciseName, durationMinutes, intensity).
 *  Returns 404 if the entry or its parent day/split is not found. */
router.put('/splits/:splitId/days/:dayId/cardio/:cardioId', async (req: Request, res: Response) => {
  try {
    const cardio = await service.updateCardioInDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, cardioId: req.params.cardioId, updates: req.body });
    if (!cardio) return res.status(404).json({ error: 'Cardio session not found' });
    res.json(cardio);
  } catch (err) {
    req.log.error({ err }, `fitness ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /splits/:splitId/days/:dayId/cardio/:cardioId — Removes a cardio
 *  entry from a day. Returns 404 if the entry or its parent day/split is
 *  not found. */
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
