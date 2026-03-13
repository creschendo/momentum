import express, { Request, Response } from 'express';
import {
  SESSION_COOKIE_NAME,
  createUser,
  verifyUserCredentials,
  createSession,
  getSessionCookieOptions,
  getUserFromSessionToken,
  revokeSessionByToken
} from './service.js';
import type { AuthRegisterBody, AuthLoginBody } from '../../types.js';

const router = express.Router();

/** Extracts the real client IP address from the request, preferring the
 *  X-Forwarded-For header (set by proxies/load balancers) over req.ip. */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '';
}

/** POST /register — Creates a new user account.
 *  Validates email format and minimum password length (8 chars), then creates
 *  the user record and immediately opens a session. Returns 201 with the public
 *  user object and sets the session cookie. Returns 409 if the email is already
 *  registered. */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = (req.body || {}) as AuthRegisterBody;

    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await createUser({ email, password, displayName });
    const session = await createSession({
      userId: user.id,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: getClientIp(req)
    });

    res.cookie(SESSION_COOKIE_NAME, session.token, getSessionCookieOptions());
    return res.status(201).json({ user });
  } catch (err) {
    const code = (err as { code?: string } | null | undefined)?.code;
    if (code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    return res.status(500).json({ error: 'Failed to register' });
  }
});

/** POST /login — Authenticates an existing user with email and password.
 *  On success, creates a new session, sets the session cookie, and returns
 *  the public user object. Returns 401 if credentials are invalid. */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = (req.body || {}) as AuthLoginBody;
    const user = await verifyUserCredentials({ email, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const session = await createSession({
      userId: user.id,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: getClientIp(req)
    });

    res.cookie(SESSION_COOKIE_NAME, session.token, getSessionCookieOptions());
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to login' });
  }
});

/** POST /logout — Revokes the current session token and clears the session
 *  cookie, effectively signing the user out. Safe to call even if no valid
 *  session exists. */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    await revokeSessionByToken(token);
    res.clearCookie(SESSION_COOKIE_NAME, { ...getSessionCookieOptions(), maxAge: undefined });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

/** GET /me — Returns the currently authenticated user based on the session
 *  cookie. Returns 401 if the session is missing, expired, or revoked. */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    const user = await getUserFromSessionToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get session' });
  }
});

export default router;
