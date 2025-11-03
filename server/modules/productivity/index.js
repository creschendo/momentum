import express from 'express';

const router = express.Router();

// GET /api/productivity/status
router.get('/status', (req, res) => {
  res.json({ module: 'productivity', status: 'ok', info: 'Productivity module ready' });
});

// Placeholder: add productivity-specific routes here (tasks, timers, notes ...)

export default router;
