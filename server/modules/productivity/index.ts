import express, { Request, Response } from 'express';
import service from './service.js';

const router = express.Router();

/** Extracts the authenticated user's ID from the request object, which is
 *  attached by the requireAuth middleware before these handlers run. */
function getUserId(req: Request): number {
  return (req as any).user.id;
}

/** GET /status — Health check confirming the productivity module is loaded. */
// GET /api/productivity/status
router.get('/status', (req: Request, res: Response) => {
  res.json({ module: 'productivity', status: 'ok', info: 'Productivity module ready' });
});

/** GET /events — Returns calendar events for the user ordered by date and
 *  time. Accepts optional `startDate` and `endDate` (YYYY-MM-DD) query
 *  params to filter to a specific date range. */
// GET /api/productivity/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const list = await service.listEvents({ userId: getUserId(req), startDate: startDate as string | undefined, endDate: endDate as string | undefined });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /events — Creates a new calendar event. title (non-empty),
 *  dateKey (YYYY-MM-DD), and time (HH:MM) are all required. description is
 *  optional. Returns 201 with the created event. */
// POST /api/productivity/events  body: { title, dateKey, time, description? }
router.post('/events', async (req: Request, res: Response) => {
  try {
    const { title, dateKey, time, description } = req.body || {};
    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey))) {
      return res.status(400).json({ error: 'dateKey must be YYYY-MM-DD' });
    }
    if (!time || !/^\d{2}:\d{2}$/.test(String(time))) {
      return res.status(400).json({ error: 'time must be HH:MM' });
    }

    const created = await service.createEvent({
      userId: getUserId(req),
      title,
      dateKey: String(dateKey),
      time: String(time),
      description
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PATCH /events/:id — Partially updates an event. All body fields are
 *  optional; dateKey and time are format-validated if present. Returns 404
 *  if the event is not found or not owned by the user. */
// PATCH /api/productivity/events/:id  body: { title?, dateKey?, time?, description? }
router.patch('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, dateKey, time, description } = req.body || {};

    if (dateKey !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey))) {
      return res.status(400).json({ error: 'dateKey must be YYYY-MM-DD' });
    }
    if (time !== undefined && !/^\d{2}:\d{2}$/.test(String(time))) {
      return res.status(400).json({ error: 'time must be HH:MM' });
    }

    const updated = await service.updateEvent({ userId: getUserId(req), id, patch: { title, dateKey, time, description } });
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /events/:id — Removes an event by ID. Returns 204 on success or
 *  404 if the event is not found or not owned by the current user. */
// DELETE /api/productivity/events/:id
router.delete('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ok = await service.removeEvent({ userId: getUserId(req), id });
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /tasks — Returns all tasks for the user ordered newest-first,
 *  including completion status (done) and any attached notes. */
// GET /api/productivity/tasks
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const list = await service.listTasks({ userId: getUserId(req) });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /tasks — Creates a new task with the given title (required) and
 *  optional notes. The task starts with done=false. Returns 201. */
// POST /api/productivity/tasks  body: { title, notes }
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { title, notes } = req.body;
    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    const created = await service.createTask({ userId: getUserId(req), title, notes });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PATCH /tasks/:id — Partially updates a task's title, notes, and/or done
 *  flag. Omitted fields retain their current value. Returns 404 if the
 *  task is not found. */
// PATCH /api/productivity/tasks/:id  body: { title?, notes?, done? }
router.patch('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await service.updateTask({ userId: getUserId(req), id, patch: req.body || {} });
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /tasks/:id — Removes a task by ID. Returns 204 on success or 404
 *  if the task is not found or not owned by the current user. */
// DELETE /api/productivity/tasks/:id
router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ok = await service.removeTask({ userId: getUserId(req), id });
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
