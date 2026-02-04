import express from 'express';
import * as service from './service.js';

const router = express.Router();

// GET /api/fitness/status
router.get('/status', (req, res) => {
  res.json({ module: 'fitness', status: 'ok', info: 'Fitness module ready' });
});

// Splits CRUD
router.get('/splits', (req, res) => {
  res.json(service.getSplits());
});

router.post('/splits', (req, res) => {
  const { title, days } = req.body;
  if (!title || !days) {
    return res.status(400).json({ error: 'Title and days are required' });
  }
  const split = service.addSplit({ title, days: Number(days) });
  res.json(split);
});

router.get('/splits/:id', (req, res) => {
  const split = service.getSplit(req.params.id);
  if (!split) return res.status(404).json({ error: 'Split not found' });
  res.json(split);
});

router.put('/splits/:id', (req, res) => {
  const split = service.updateSplit(req.params.id, req.body);
  if (!split) return res.status(404).json({ error: 'Split not found' });
  res.json(split);
});

router.delete('/splits/:id', (req, res) => {
  const deleted = service.deleteSplit(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Split not found' });
  res.json({ message: 'Split deleted' });
});

// Days
router.post('/splits/:splitId/days', (req, res) => {
  const day = service.addDayToSplit(req.params.splitId, req.body);
  if (!day) return res.status(404).json({ error: 'Split not found' });
  res.json(day);
});

router.put('/splits/:splitId/days/:dayId', (req, res) => {
  const day = service.updateDayInSplit(req.params.splitId, req.params.dayId, req.body);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  res.json(day);
});

router.delete('/splits/:splitId/days/:dayId', (req, res) => {
  const deleted = service.removeDayFromSplit(req.params.splitId, req.params.dayId);
  if (!deleted) return res.status(404).json({ error: 'Day not found' });
  res.json({ message: 'Day deleted' });
});

// Lifts
router.post('/splits/:splitId/days/:dayId/lifts', (req, res) => {
  const lift = service.addLiftToDay(req.params.splitId, req.params.dayId, req.body);
  if (!lift) return res.status(404).json({ error: 'Split or day not found' });
  res.json(lift);
});

router.put('/splits/:splitId/days/:dayId/lifts/:liftId', (req, res) => {
  const lift = service.updateLiftInDay(req.params.splitId, req.params.dayId, req.params.liftId, req.body);
  if (!lift) return res.status(404).json({ error: 'Lift not found' });
  res.json(lift);
});

router.delete('/splits/:splitId/days/:dayId/lifts/:liftId', (req, res) => {
  const deleted = service.removeLiftFromDay(req.params.splitId, req.params.dayId, req.params.liftId);
  if (!deleted) return res.status(404).json({ error: 'Lift not found' });
  res.json({ message: 'Lift deleted' });
});

// Cardio
router.post('/splits/:splitId/days/:dayId/cardio', (req, res) => {
  const cardio = service.addCardioToDay(req.params.splitId, req.params.dayId, req.body);
  if (!cardio) return res.status(404).json({ error: 'Split or day not found' });
  res.json(cardio);
});

router.put('/splits/:splitId/days/:dayId/cardio/:cardioId', (req, res) => {
  const cardio = service.updateCardioInDay(req.params.splitId, req.params.dayId, req.params.cardioId, req.body);
  if (!cardio) return res.status(404).json({ error: 'Cardio session not found' });
  res.json(cardio);
});

router.delete('/splits/:splitId/days/:dayId/cardio/:cardioId', (req, res) => {
  const deleted = service.removeCardioFromDay(req.params.splitId, req.params.dayId, req.params.cardioId);
  if (!deleted) return res.status(404).json({ error: 'Cardio session not found' });
  res.json({ message: 'Cardio session deleted' });
});

export default router;
