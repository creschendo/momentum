import express, { Request, Response } from 'express';
import service from './service.js';

const router = express.Router();

function getUserId(req: Request): number {
  return (req as any).user.id;
}

/** GET /status — Health check. */
router.get('/status', (_req: Request, res: Response) => {
  res.json({ module: 'notes', status: 'ok', info: 'Notes module ready' });
});

/** GET / — Returns all notes for the user ordered newest-first. */
router.get('/', async (req: Request, res: Response) => {
  try {
    const list = await service.listNotes({ userId: getUserId(req) });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST / — Creates a new note. title is required. */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body || {};
    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ error: 'title is required' });
    }
    const created = await service.createNote({ userId: getUserId(req), title, content });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** PATCH /:id — Partially updates a note. */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body || {};
    const updated = await service.updateNote({ userId: getUserId(req), id, patch: { title, content } });
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** DELETE /:id — Removes a note. Returns 204 on success. */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ok = await service.removeNote({ userId: getUserId(req), id });
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
