import type { Request, Response, NextFunction } from 'express';
import { SESSION_COOKIE_NAME, getUserFromSessionToken } from './service.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    const user = await getUserFromSessionToken(token);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    (req as any).user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth check failed' });
  }
}
