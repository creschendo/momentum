import express from 'express';

const router = express.Router();

// GET /api/nutrition/status
router.get('/status', (req, res) => {
  res.json({ module: 'nutrition', status: 'ok', info: 'Nutrition module ready' });
});

// Placeholder: add nutrition-specific routes here (meals, calories, logs ...)

export default router;
