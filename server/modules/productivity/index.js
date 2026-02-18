import express from 'express';
import service from './service.js';

const router = express.Router();

// GET /api/productivity/status
router.get('/status', (req, res) => {
  res.json({ module: 'productivity', status: 'ok', info: 'Productivity module ready' });
});

// GET /api/productivity/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/events', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const list = await service.listEvents({ startDate, endDate });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/productivity/events  body: { title, dateKey, time, description? }
router.post('/events', async (req, res) => {
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
      title,
      dateKey: String(dateKey),
      time: String(time),
      description
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/productivity/events/:id  body: { title?, dateKey?, time?, description? }
router.patch('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, dateKey, time, description } = req.body || {};

    if (dateKey !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey))) {
      return res.status(400).json({ error: 'dateKey must be YYYY-MM-DD' });
    }
    if (time !== undefined && !/^\d{2}:\d{2}$/.test(String(time))) {
      return res.status(400).json({ error: 'time must be HH:MM' });
    }

    const updated = await service.updateEvent(id, { title, dateKey, time, description });
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/productivity/events/:id
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await service.removeEvent(id);
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/productivity/tasks
router.get('/tasks', async (req, res) => {
  try {
    const list = await service.listTasks();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/productivity/tasks  body: { title, notes }
router.post('/tasks', async (req, res) => {
  try {
    const { title, notes } = req.body;
    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    const created = await service.createTask({ title, notes });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/productivity/tasks/:id  body: { title?, notes?, done? }
router.patch('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await service.updateTask(id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/productivity/tasks/:id
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await service.removeTask(id);
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
