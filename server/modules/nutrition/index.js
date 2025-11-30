import express from 'express';
import service from './service.js';

const router = express.Router();

// GET /api/nutrition/status
router.get('/status', (req, res) => {
  res.json({ module: 'nutrition', status: 'ok', info: 'Nutrition module ready' });
});

// POST /api/nutrition/water
// body: { volumeMl: number, timestamp?: ISOString }
router.post('/water', (req, res) => {
  try {
    const { volumeMl, timestamp } = req.body;
    if (!volumeMl || isNaN(volumeMl) || Number(volumeMl) <= 0) {
      return res.status(400).json({ error: 'volumeMl must be a positive number' });
    }
    const entry = service.addWaterEntry({ volumeMl: Number(volumeMl), timestamp });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/nutrition/water/entries
// optional query: since=ISOString
router.get('/water/entries', (req, res) => {
  const { since } = req.query;
  try {
    const list = service.listEntries({ since });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/nutrition/water/summary?period=daily|weekly|monthly
router.get('/water/summary', (req, res) => {
  const { period = 'daily' } = req.query;
  try {
    const summary = service.sumForPeriod(period);
    res.json(summary);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

export default router;
