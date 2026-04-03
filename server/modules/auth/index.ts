import express, { Request, Response } from 'express';
import { z } from 'zod';
import {
  SESSION_COOKIE_NAME,
  createUser,
  verifyUserCredentials,
  createSession,
  getSessionCookieOptions,
  getUserFromSessionToken,
  revokeSessionByToken,
  getUserProfile,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  deleteUserAccount,
  listUserSessions,
  revokeSessionById,
  createPasswordResetToken,
  consumePasswordResetToken
} from './service.js';
import { requireAuth } from './middleware.js';
import { validate } from '../../lib/validate.js';
import { sendPasswordResetEmail } from '../../lib/email.js';

const router = express.Router();

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().optional()
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const ProfileBody = z.object({
  displayName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sex: z.enum(['male', 'female']).optional(),
  heightCm: z.number().positive().optional()
});

const EmailBody = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Current password is required')
});

const PasswordBody = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

const DeleteAccountBody = z.object({
  password: z.string().min(1, 'Password is required')
});

const SessionIdParams = z.object({
  id: z.coerce.number().int().positive()
});

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
  const body = validate(RegisterBody, req.body, res);
  if (!body) return;
  try {
    const user = await createUser(body);
    const session = await createSession({
      userId: user.id,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: getClientIp(req)
    });
    res.cookie(SESSION_COOKIE_NAME, session.token, getSessionCookieOptions());
    return res.status(201).json({ user });
  } catch (err) {
    const code = (err as { code?: string } | null | undefined)?.code;
    if (code === '23505') return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: 'Failed to register' });
  }
});

/** POST /login — Authenticates an existing user with email and password.
 *  On success, creates a new session, sets the session cookie, and returns
 *  the public user object. Returns 401 if credentials are invalid. */
router.post('/login', async (req: Request, res: Response) => {
  const body = validate(LoginBody, req.body, res);
  if (!body) return;
  try {
    const user = await verifyUserCredentials(body);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
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
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get session' });
  }
});

// ── Profile ───────────────────────────────────────────────────────────────────

router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = await getUserProfile((req as any).user.id);
    return res.json({ profile });
  } catch {
    return res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  const body = validate(ProfileBody, req.body, res);
  if (!body) return;
  try {
    const profile = await updateUserProfile((req as any).user.id, body);
    return res.json({ profile });
  } catch {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── Account ───────────────────────────────────────────────────────────────────

router.put('/email', requireAuth, async (req: Request, res: Response) => {
  const body = validate(EmailBody, req.body, res);
  if (!body) return;
  try {
    const user = await updateUserEmail((req as any).user.id, body.email, body.password);
    return res.json({ user });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'Invalid password') return res.status(401).json({ error: msg });
    const code = (err as { code?: string })?.code;
    if (code === '23505') return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: 'Failed to update email' });
  }
});

router.put('/password', requireAuth, async (req: Request, res: Response) => {
  const body = validate(PasswordBody, req.body, res);
  if (!body) return;
  try {
    await updateUserPassword((req as any).user.id, body.currentPassword, body.newPassword);
    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'Invalid current password') return res.status(401).json({ error: msg });
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

router.delete('/account', requireAuth, async (req: Request, res: Response) => {
  const body = validate(DeleteAccountBody, req.body, res);
  if (!body) return;
  try {
    await deleteUserAccount((req as any).user.id, body.password);
    res.clearCookie(SESSION_COOKIE_NAME, { ...getSessionCookieOptions(), maxAge: undefined });
    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'Invalid password') return res.status(401).json({ error: msg });
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ── Password reset ─────────────────────────────────────────────────────────────

const ForgotPasswordBody = z.object({
  email: z.string().email()
});

const ResetPasswordBody = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

/** POST /forgot-password — Generates a password reset token for the given email.
 *  Always returns 200 regardless of whether the email exists (prevents enumeration).
 *  The reset token is logged — wire this to an email service to deliver it to users. */
router.post('/forgot-password', async (req: Request, res: Response) => {
  const body = validate(ForgotPasswordBody, req.body, res);
  if (!body) return;
  try {
    const result = await createPasswordResetToken(body.email);
    if (result) {
      const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password?token=${result.token}`;
      req.log.info({ userId: result.userId }, 'Password reset token generated');
      try {
        await sendPasswordResetEmail(body.email, resetUrl);
      } catch (emailErr) {
        req.log.error({ err: emailErr, resetUrl }, 'Failed to send reset email — token still valid, URL logged');
      }
    }
    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, 'forgot-password failed');
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

/** POST /reset-password — Consumes a reset token and sets a new password.
 *  The token is single-use and expires after 1 hour. */
router.post('/reset-password', async (req: Request, res: Response) => {
  const body = validate(ResetPasswordBody, req.body, res);
  if (!body) return;
  try {
    await consumePasswordResetToken(body.token, body.newPassword);
    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'Invalid or expired reset token' || msg === 'Reset token has already been used') {
      return res.status(400).json({ error: msg });
    }
    req.log.error({ err }, 'reset-password failed');
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ── Sessions ──────────────────────────────────────────────────────────────────

router.get('/sessions', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    const sessions = await listUserSessions((req as any).user.id, token);
    return res.json({ sessions });
  } catch {
    return res.status(500).json({ error: 'Failed to list sessions' });
  }
});

router.delete('/sessions/:id', requireAuth, async (req: Request, res: Response) => {
  const params = validate(SessionIdParams, req.params, res);
  if (!params) return;
  try {
    const revoked = await revokeSessionById((req as any).user.id, params.id);
    if (!revoked) return res.status(404).json({ error: 'Session not found' });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Failed to revoke session' });
  }
});

export default router;
