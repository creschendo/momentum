// @ts-check
import express from 'express';
import service from './service.js';

/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {Request & { user: import('../../types').User }} AuthedRequest */

const router = express.Router();

/**
 * @param {Request} req
 * @returns {number}
 */
function getUserId(req) {
  return /** @type {AuthedRequest} */ (req).user.id;
}

// GET /api/productivity/status
/** @param {AuthedRequest} req @param {Response} res */
router.get('/status', (req, res) => {
  res.json({ module: 'productivity', status: 'ok', info: 'Productivity module ready' });
});

// GET /api/productivity/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
/** @param {AuthedRequest} req @param {Response} res */
router.get('/events', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const list = await service.listEvents({ userId: getUserId(req), startDate, endDate });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/productivity/events  body: { title, dateKey, time, description? }
/** @param {AuthedRequest} req @param {Response} res */
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
      userId: getUserId(req),
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
/** @param {AuthedRequest} req @param {Response} res */
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

    const updated = await service.updateEvent({ userId: getUserId(req), id, patch: { title, dateKey, time, description } });
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/productivity/events/:id
/** @param {AuthedRequest} req @param {Response} res */
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await service.removeEvent({ userId: getUserId(req), id });
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/productivity/tasks
/** @param {AuthedRequest} req @param {Response} res */
router.get('/tasks', async (req, res) => {
  try {
    const list = await service.listTasks({ userId: getUserId(req) });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/productivity/tasks  body: { title, notes }
/** @param {AuthedRequest} req @param {Response} res */
router.post('/tasks', async (req, res) => {
  try {
    const { title, notes } = req.body;
    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    const created = await service.createTask({ userId: getUserId(req), title, notes });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/productivity/tasks/:id  body: { title?, notes?, done? }
/** @param {AuthedRequest} req @param {Response} res */
router.patch('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await service.updateTask({ userId: getUserId(req), id, patch: req.body || {} });
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/productivity/tasks/:id
/** @param {AuthedRequest} req @param {Response} res */
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await service.removeTask({ userId: getUserId(req), id });
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
