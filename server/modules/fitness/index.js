import express from 'express';
import * as service from './service.js';

const router = express.Router();

// GET /api/fitness/status
router.get('/status', (req, res) => {
  res.json({ module: 'fitness', status: 'ok', info: 'Fitness module ready' });
});

// Splits CRUD
router.get('/splits', async (req, res) => {
  try {
    const splits = await service.getSplits({ userId: req.user.id });
    res.json(splits);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/splits', async (req, res) => {
  try {
    const { title, name, days } = req.body;
    const splitName = name || title;
    if (!splitName || days === undefined || days === null) {
      return res.status(400).json({ error: 'Name and days are required' });
    }
    const split = await service.addSplit({ userId: req.user.id, name: splitName, daysCount: Number(days) });
    res.status(201).json(split);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/splits/:id', async (req, res) => {
  try {
    const split = await service.getSplit({ userId: req.user.id, id: req.params.id });
    if (!split) return res.status(404).json({ error: 'Split not found' });
    res.json(split);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put('/splits/:id', async (req, res) => {
  try {
    const split = await service.updateSplit({ userId: req.user.id, id: req.params.id, updates: req.body });
    if (!split) return res.status(404).json({ error: 'Split not found' });
    res.json(split);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/splits/:id', async (req, res) => {
  try {
    const deleted = await service.deleteSplit({ userId: req.user.id, id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Split not found' });
    res.json({ message: 'Split deleted' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Days
router.post('/splits/:splitId/days', async (req, res) => {
  try {
    const day = await service.addDayToSplit({ userId: req.user.id, splitId: req.params.splitId, dayData: req.body });
    if (!day) return res.status(404).json({ error: 'Split not found' });
    res.status(201).json(day);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put('/splits/:splitId/days/:dayId', async (req, res) => {
  try {
    const day = await service.updateDayInSplit({ userId: req.user.id, splitId: req.params.splitId, dayId: req.params.dayId, updates: req.body });
    if (!day) return res.status(404).json({ error: 'Day not found' });
    res.json(day);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/splits/:splitId/days/:dayId', async (req, res) => {
  try {
    const deleted = await service.removeDayFromSplit({ userId: req.user.id, splitId: req.params.splitId, dayId: req.params.dayId });
    if (!deleted) return res.status(404).json({ error: 'Day not found' });
    res.json({ message: 'Day deleted' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Lifts
router.post('/splits/:splitId/days/:dayId/lifts', async (req, res) => {
  try {
    const lift = await service.addLiftToDay({ userId: req.user.id, splitId: req.params.splitId, dayId: req.params.dayId, lift: req.body });
    if (!lift) return res.status(404).json({ error: 'Split or day not found' });
    res.status(201).json(lift);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put('/splits/:splitId/days/:dayId/lifts/:liftId', async (req, res) => {
  try {
    const lift = await service.updateLiftInDay({ userId: req.user.id, splitId: req.params.splitId, dayId: req.params.dayId, liftId: req.params.liftId, updates: req.body });
    if (!lift) return res.status(404).json({ error: 'Lift not found' });
    res.json(lift);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/splits/:splitId/days/:dayId/lifts/:liftId', async (req, res) => {
  try {
    const deleted = await service.removeLiftFromDay({ userId: req.user.id, splitId: req.params.splitId, dayId: req.params.dayId, liftId: req.params.liftId });
    if (!deleted) return res.status(404).json({ error: 'Lift not found' });
    res.json({ message: 'Lift deleted' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Cardio
router.post('/splits/:splitId/days/:dayId/cardio', async (req, res) => {
  try {
    const cardio = await service.addCardioToDay({ userId: req.user.id, splitId: req.params.splitId, dayId: req.params.dayId, cardio: req.body });
    if (!cardio) return res.status(404).json({ error: 'Split or day not found' });
    res.status(201).json(cardio);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.put('/splits/:splitId/days/:dayId/cardio/:cardioId', async (req, res) => {
  try {
    const cardio = await service.updateCardioInDay({ userId: req.user.id, splitId: req.params.splitId, dayId: req.params.dayId, cardioId: req.params.cardioId, updates: req.body });
    if (!cardio) return res.status(404).json({ error: 'Cardio session not found' });
    res.json(cardio);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/splits/:splitId/days/:dayId/cardio/:cardioId', async (req, res) => {
  try {
    const deleted = await service.removeCardioFromDay({ userId: req.user.id, splitId: req.params.splitId, dayId: req.params.dayId, cardioId: req.params.cardioId });
    if (!deleted) return res.status(404).json({ error: 'Cardio session not found' });
    res.json({ message: 'Cardio session deleted' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
