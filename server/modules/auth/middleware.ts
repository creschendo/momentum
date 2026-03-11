import { SESSION_COOKIE_NAME, getUserFromSessionToken } from './service.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    const user = await getUserFromSessionToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(500).json({ error: 'Auth check failed' });
  }
}
