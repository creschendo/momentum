import express, { Request, Response } from 'express';
import { z } from 'zod';
import service from './service.js';
import { validate } from '../../lib/validate.js';

const router = express.Router();

const isValidDate = (s: string) => !isNaN(new Date(s).getTime());

const SleepBody = z.object({
  startTime: z.string().refine(isValidDate, { message: 'Invalid date format' }),
  endTime: z.string().refine(isValidDate, { message: 'Invalid date format' }),
  quality: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional()
}).refine(b => !isValidDate(b.startTime) || !isValidDate(b.endTime) || new Date(b.endTime) > new Date(b.startTime), {
  message: 'endTime must be after startTime',
  path: ['endTime']
});

/** GET /status — Health check confirming the sleep module is loaded. */
router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'sleep', status: 'ok', info: 'Sleep module ready' });
});

/** GET /sessions — Returns the user's sleep sessions, newest-first. */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const sessions = await service.listSleepSessions({ userId: (req as any).user.id, limit: limit ? Number(limit) : 30 });
    res.json(sessions);
  } catch (err) {
    req.log.error({ err }, `sleep ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /sessions — Records a sleep session. */
router.post('/sessions', async (req: Request, res: Response) => {
  const body = validate(SleepBody, req.body, res);
  if (!body) return;
  try {
    const created = await service.addSleepSession({
      userId: (req as any).user.id,
      startTime: new Date(body.startTime).toISOString(),
      endTime: new Date(body.endTime).toISOString(),
      quality: body.quality,
      notes: body.notes
    });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, `sleep ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /sessions/:id — Removes a sleep session by ID. */
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await service.deleteSleepSession({ userId: (req as any).user.id, id });
    if (!deleted) return res.status(404).json({ error: 'Sleep session not found' });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, `sleep ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /summary — Computes sleep statistics over the last N days. */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    const summary = await service.getSleepSummary({ userId: (req as any).user.id, days: days ? Number(days) : 7 });
    res.json(summary);
  } catch (err) {
    req.log.error({ err }, `sleep ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
