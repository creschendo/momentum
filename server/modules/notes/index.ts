import express, { Request, Response } from 'express';
import { z } from 'zod';
import service from './service.js';
import { validate } from '../../lib/validate.js';

const router = express.Router();

function getUserId(req: Request): number {
  return (req as any).user.id;
}

const NoteBody = z.object({
  title: z.string().trim().min(1, 'title is required'),
  content: z.string().optional()
});

const NotePatchBody = z.object({
  title: z.string().optional(),
  content: z.string().optional()
});

/** GET /status — Health check. */
router.get('/status', (_req: Request, res: Response) => {
  res.json({ module: 'notes', status: 'ok', info: 'Notes module ready' });
});

/** GET / — Returns notes for the user ordered newest-first. Accepts ?limit (default 100, max 500). */
router.get('/', async (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
  try {
    const list = await service.listNotes({ userId: getUserId(req), limit });
    res.json(list);
  } catch (err) {
    req.log.error({ err }, `notes ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST / — Creates a new note. title is required. */
router.post('/', async (req: Request, res: Response) => {
  const body = validate(NoteBody, req.body, res);
  if (!body) return;
  try {
    const created = await service.createNote({ userId: getUserId(req), ...body });
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, `notes ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PATCH /:id — Partially updates a note. */
router.patch('/:id', async (req: Request, res: Response) => {
  const body = validate(NotePatchBody, req.body, res);
  if (!body) return;
  try {
    const updated = await service.updateNote({ userId: getUserId(req), id: req.params.id, patch: body });
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, `notes ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /:id — Removes a note. Returns 204 on success. */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ok = await service.removeNote({ userId: getUserId(req), id: req.params.id });
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, `notes ${req.method} ${req.path} failed`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
