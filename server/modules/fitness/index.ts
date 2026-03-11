import express, { Request, Response } from 'express';
import * as service from './service.js';

const router = express.Router();

function getUserId(req: Request): number {
  return (req as any).user.id;
}

// GET /api/fitness/status
router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'fitness', status: 'ok', info: 'Fitness module ready' });
});

// Splits CRUD
router.get('/splits', async (req: Request, res: Response) => {
  try {
    const splits = await service.getSplits({ userId: getUserId(req) });
    res.json(splits);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

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
    res.status(500).json({ error: String(err) });
  }
});

router.get('/splits/:id', async (req: Request, res: Response) => {
  try {
    const split = await service.getSplit({ userId: getUserId(req), id: req.params.id });
    if (!split) return res.status(404).json({ error: 'Split not found' });
    res.json(split);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put('/splits/:id', async (req: Request, res: Response) => {
  try {
    const split = await service.updateSplit({ userId: getUserId(req), id: req.params.id, updates: req.body });
    if (!split) return res.status(404).json({ error: 'Split not found' });
    res.json(split);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/splits/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await service.deleteSplit({ userId: getUserId(req), id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Split not found' });
    res.json({ message: 'Split deleted' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Days
router.post('/splits/:splitId/days', async (req: Request, res: Response) => {
  try {
    const day = await service.addDayToSplit({ userId: getUserId(req), splitId: req.params.splitId, dayData: req.body });
    if (!day) return res.status(404).json({ error: 'Split not found' });
    res.status(201).json(day);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put('/splits/:splitId/days/:dayId', async (req: Request, res: Response) => {
  try {
    const day = await service.updateDayInSplit({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, updates: req.body });
    if (!day) return res.status(404).json({ error: 'Day not found' });
    res.json(day);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/splits/:splitId/days/:dayId', async (req: Request, res: Response) => {
  try {
    const deleted = await service.removeDayFromSplit({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId });
    if (!deleted) return res.status(404).json({ error: 'Day not found' });
    res.json({ message: 'Day deleted' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Lifts
router.post('/splits/:splitId/days/:dayId/lifts', async (req: Request, res: Response) => {
  try {
    const lift = await service.addLiftToDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, lift: req.body });
    if (!lift) return res.status(404).json({ error: 'Split or day not found' });
    res.status(201).json(lift);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put('/splits/:splitId/days/:dayId/lifts/:liftId', async (req: Request, res: Response) => {
  try {
    const lift = await service.updateLiftInDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, liftId: req.params.liftId, updates: req.body });
    if (!lift) return res.status(404).json({ error: 'Lift not found' });
    res.json(lift);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/splits/:splitId/days/:dayId/lifts/:liftId', async (req: Request, res: Response) => {
  try {
    const deleted = await service.removeLiftFromDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, liftId: req.params.liftId });
    if (!deleted) return res.status(404).json({ error: 'Lift not found' });
    res.json({ message: 'Lift deleted' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Cardio
router.post('/splits/:splitId/days/:dayId/cardio', async (req: Request, res: Response) => {
  try {
    const cardio = await service.addCardioToDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, cardio: req.body });
    if (!cardio) return res.status(404).json({ error: 'Split or day not found' });
    res.status(201).json(cardio);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put('/splits/:splitId/days/:dayId/cardio/:cardioId', async (req: Request, res: Response) => {
  try {
    const cardio = await service.updateCardioInDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, cardioId: req.params.cardioId, updates: req.body });
    if (!cardio) return res.status(404).json({ error: 'Cardio session not found' });
    res.json(cardio);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/splits/:splitId/days/:dayId/cardio/:cardioId', async (req: Request, res: Response) => {
  try {
    const deleted = await service.removeCardioFromDay({ userId: getUserId(req), splitId: req.params.splitId, dayId: req.params.dayId, cardioId: req.params.cardioId });
    if (!deleted) return res.status(404).json({ error: 'Cardio session not found' });
    res.json({ message: 'Cardio session deleted' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
