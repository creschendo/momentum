import express from 'express';
import service from './service.js';

const router = express.Router();

// GET /api/productivity/status
router.get('/status', (req, res) => {
  res.json({ module: 'productivity', status: 'ok', info: 'Productivity module ready' });
});

// GET /api/productivity/tasks
router.get('/tasks', (req, res) => {
  try {
    const list = service.listTasks();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/productivity/tasks  body: { title, notes }
router.post('/tasks', (req, res) => {
  try {
    const { title, notes } = req.body;
    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    const created = service.createTask({ title, notes });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PATCH /api/productivity/tasks/:id  body: { title?, notes?, done? }
router.patch('/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = service.updateTask(id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/productivity/tasks/:id
router.delete('/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ok = service.removeTask(id);
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
