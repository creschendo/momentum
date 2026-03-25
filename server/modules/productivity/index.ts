import express, { Request, Response } from 'express';
import { z } from 'zod';
import service from './service.js';
import { validate } from '../../lib/validate.js';

const router = express.Router();

/** Extracts the authenticated user's ID from the request object, which is
 *  attached by the requireAuth middleware before these handlers run. */
function getUserId(req: Request): number {
  return (req as any).user.id;
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

const EventBody = z.object({
  title: z.string().trim().min(1, 'title is required'),
  dateKey: z.string().regex(dateRegex, 'dateKey must be YYYY-MM-DD'),
  time: z.string().regex(timeRegex, 'time must be HH:MM'),
  description: z.string().optional()
});

const EventPatchBody = z.object({
  title: z.string().optional(),
  dateKey: z.string().regex(dateRegex, 'dateKey must be YYYY-MM-DD').optional(),
  time: z.string().regex(timeRegex, 'time must be HH:MM').optional(),
  description: z.string().optional()
});

const TaskBody = z.object({
  title: z.string().trim().min(1, 'title is required'),
  notes: z.string().optional()
});

const TaskPatchBody = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  done: z.boolean().optional()
});

/** GET /status — Health check confirming the productivity module is loaded. */
router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'productivity', status: 'ok', info: 'Productivity module ready' });
});

/** GET /events — Returns calendar events for the user ordered by date and time. */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const list = await service.listEvents({ userId: getUserId(req), startDate: startDate as string | undefined, endDate: endDate as string | undefined });
    res.json(list);
  } catch (err) {
    req.log.error({ err }, `productivity ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /events — Creates a new calendar event. */
router.post('/events', async (req: Request, res: Response) => {
  const body = validate(EventBody, req.body, res);
  if (!body) return;
  try {
    const created = await service.createEvent({ userId: getUserId(req), ...body });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, `productivity ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PATCH /events/:id — Partially updates an event. */
router.patch('/events/:id', async (req: Request, res: Response) => {
  const body = validate(EventPatchBody, req.body, res);
  if (!body) return;
  try {
    const updated = await service.updateEvent({ userId: getUserId(req), id: req.params.id, patch: body });
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, `productivity ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /events/:id — Removes an event by ID. */
router.delete('/events/:id', async (req: Request, res: Response) => {
  try {
    const ok = await service.removeEvent({ userId: getUserId(req), id: req.params.id });
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, `productivity ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /tasks — Returns all tasks for the user ordered newest-first. */
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const list = await service.listTasks({ userId: getUserId(req) });
    res.json(list);
  } catch (err) {
    req.log.error({ err }, `productivity ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /tasks — Creates a new task. */
router.post('/tasks', async (req: Request, res: Response) => {
  const body = validate(TaskBody, req.body, res);
  if (!body) return;
  try {
    const created = await service.createTask({ userId: getUserId(req), ...body });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, `productivity ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PATCH /tasks/:id — Partially updates a task. */
router.patch('/tasks/:id', async (req: Request, res: Response) => {
  const body = validate(TaskPatchBody, req.body, res);
  if (!body) return;
  try {
    const updated = await service.updateTask({ userId: getUserId(req), id: req.params.id, patch: body });
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, `productivity ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /tasks/:id — Removes a task by ID. */
router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const ok = await service.removeTask({ userId: getUserId(req), id: req.params.id });
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, `productivity ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
