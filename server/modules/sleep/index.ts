import express, { Request, Response } from 'express';
import service from './service.js';

const router = express.Router();

/** GET /status — Health check confirming the sleep module is loaded. */
router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'sleep', status: 'ok', info: 'Sleep module ready' });
});

/** GET /sessions — Returns the user's sleep sessions, newest-first.
 *  The `limit` query param (default 30, max 120) controls how many records
 *  are returned. Each session includes a computed durationHours field. */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const sessions = await service.listSleepSessions({
      userId: (req as any).user.id,
      limit: limit ? Number(limit) : 30
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /sessions — Records a sleep session. Requires startTime and endTime
 *  as ISO datetime strings with endTime strictly after startTime. quality
 *  (1–5, default 3) and notes are optional. Returns 201 with the session
 *  including computed durationHours. */
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /sessions/:id — Removes a sleep session by ID. Returns 404 if
 *  the session is not found or does not belong to the current user. */
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteSleepSession({ userId: (req as any).user.id, id });
    if (!deleted) {
      return res.status(404).json({ error: 'Sleep session not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /summary — Computes sleep statistics over the last N days (default
 *  7, clamped to [3, 90]). Returns session count, average duration in hours,
 *  average quality score, and the most recent session. */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const summary = await service.getSleepSummary({
      userId: (req as any).user.id,
      days: days ? Number(days) : 7
    });
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
