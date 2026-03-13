import type { Request, Response, NextFunction } from 'express';
import { SESSION_COOKIE_NAME, getUserFromSessionToken } from './service.js';

/** Express middleware that enforces authentication on protected routes.
 *  Reads the session cookie, validates the token via getUserFromSessionToken,
 *  and attaches the resolved User to req.user before calling next().
 *  Responds with 401 if the session is missing or invalid, 500 on error. */
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
