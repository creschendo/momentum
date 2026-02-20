import express from 'express';
import {
  SESSION_COOKIE_NAME,
  createUser,
  verifyUserCredentials,
  createSession,
  getSessionCookieOptions,
  getUserFromSessionToken,
  revokeSessionByToken
} from './service.js';

const router = express.Router();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '';
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body || {};

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
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    return res.status(500).json({ error: 'Failed to register' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
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

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    await revokeSessionByToken(token);
    res.clearCookie(SESSION_COOKIE_NAME, { ...getSessionCookieOptions(), maxAge: undefined });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

router.get('/me', async (req, res) => {
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
