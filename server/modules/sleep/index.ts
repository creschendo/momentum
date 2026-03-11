import express, { Request, Response } from 'express';
import service from './service.js';

const router = express.Router();

router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'sleep', status: 'ok', info: 'Sleep module ready' });
});

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const sessions = await service.listSleepSessions({
      userId: (req as any).user.id,
      limit: limit ? Number(limit) : 30
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/sessions', async (req: Request, res: Response) => {
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
      userId: (req as any).user.id,
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

router.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteSleepSession({ userId: (req as any).user.id, id });
    if (!deleted) {
      return res.status(404).json({ error: 'Sleep session not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const summary = await service.getSleepSummary({
      userId: (req as any).user.id,
      days: days ? Number(days) : 7
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
