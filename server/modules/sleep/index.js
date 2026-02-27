import express from 'express';
import service from './service.js';

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ module: 'sleep', status: 'ok', info: 'Sleep module ready' });
});

router.get('/sessions', async (req, res) => {
  try {
    const { limit } = req.query;
    const sessions = await service.listSleepSessions({
      userId: req.user.id,
      limit: limit ? Number(limit) : 30
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const { startTime, endTime, quality, notes } = req.body || {};

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'startTime and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (end <= start) {
      return res.status(400).json({ error: 'endTime must be after startTime' });
    }

    const created = await service.addSleepSession({
      userId: req.user.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      quality,
      notes
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteSleepSession({ userId: req.user.id, id });
    if (!deleted) {
      return res.status(404).json({ error: 'Sleep session not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { days } = req.query;
    const summary = await service.getSleepSummary({
      userId: req.user.id,
      days: days ? Number(days) : 7
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
