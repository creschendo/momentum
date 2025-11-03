import express from 'express';

const router = express.Router();

// GET /api/fitness/status
router.get('/status', (req, res) => {
  res.json({ module: 'fitness', status: 'ok', info: 'Fitness module ready' });
});

// Placeholder: add fitness-specific routes here (workouts, routines, tracking ...)

export default router;
