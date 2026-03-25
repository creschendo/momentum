import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRouteMethodsByPath,
  getRouteHandler,
  runRoute
} from '../../__tests__/routerTestUtils.js';

vi.mock('../service.js', () => ({
  SESSION_COOKIE_NAME: 'momentum_session',
  createUser: vi.fn(),
  verifyUserCredentials: vi.fn(),
  createSession: vi.fn(),
  getSessionCookieOptions: vi.fn(() => ({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 123 })),
  getUserFromSessionToken: vi.fn(),
  revokeSessionByToken: vi.fn(),
  createPasswordResetToken: vi.fn(),
  consumePasswordResetToken: vi.fn()
}));

import router from '../index.js';
import * as authService from '../service.js';

describe('auth router scaffolding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers core auth routes', () => {
    const routes = getRouteMethodsByPath(router);

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/register', methods: expect.arrayContaining(['post']) }),
        expect.objectContaining({ path: '/login', methods: expect.arrayContaining(['post']) }),
        expect.objectContaining({ path: '/logout', methods: expect.arrayContaining(['post']) }),
        expect.objectContaining({ path: '/me', methods: expect.arrayContaining(['get']) })
      ])
    );
  });

  it('returns 201 on successful register', async () => {
    vi.mocked(authService.createUser).mockResolvedValueOnce({ id: 7, email: 'user@example.com', displayName: 'User' });
    vi.mocked(authService.createSession).mockResolvedValueOnce({ token: 'session-token' } as any);

    const registerHandler = getRouteHandler(router, 'post', '/register');
    const res = await runRoute(registerHandler, {
      body: { email: 'user@example.com', password: 'password123', displayName: 'User' },
      headers: { 'user-agent': 'vitest' },
      ip: '127.0.0.1'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ user: expect.objectContaining({ id: 7, email: 'user@example.com' }) });
    expect(authService.createUser).toHaveBeenCalledOnce();
    expect(authService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, userAgent: 'vitest', ipAddress: '127.0.0.1' })
    );
    expect(res.cookieCalls).toHaveLength(1);
  });

  it('returns 401 for invalid login credentials', async () => {
    vi.mocked(authService.verifyUserCredentials).mockResolvedValueOnce(null);

    const loginHandler = getRouteHandler(router, 'post', '/login');
    const res = await runRoute(loginHandler, {
      body: { email: 'user@example.com', password: 'wrong' },
      headers: {}
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid email or password' });
    expect(authService.createSession).not.toHaveBeenCalled();
  });

  it('returns 401 on /me without valid session cookie', async () => {
    vi.mocked(authService.getUserFromSessionToken).mockResolvedValueOnce(null);

    const meHandler = getRouteHandler(router, 'get', '/me');
    const res = await runRoute(meHandler, { cookies: {} });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('validates register payload before calling service', async () => {
    const registerHandler = getRouteHandler(router, 'post', '/register');
    const res = await runRoute(registerHandler, {
      body: { email: 'bad-email', password: 'password123' },
      headers: {}
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'email: Invalid email address' });
    expect(authService.createUser).not.toHaveBeenCalled();
  });

  it('returns 409 when register hits duplicate email constraint', async () => {
    const duplicateError = new Error('duplicate key');
    (duplicateError as any).code = '23505';
    vi.mocked(authService.createUser).mockRejectedValueOnce(duplicateError);

    const registerHandler = getRouteHandler(router, 'post', '/register');
    const res = await runRoute(registerHandler, {
      body: { email: 'user@example.com', password: 'password123', displayName: 'User' },
      headers: {}
    });

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: 'Email already in use' });
    expect(authService.createSession).not.toHaveBeenCalled();
  });

  it('revokes session and clears cookie on logout', async () => {
    const logoutHandler = getRouteHandler(router, 'post', '/logout');
    const res = await runRoute(logoutHandler, {
      cookies: { momentum_session: 'session-token' }
    });

    expect(authService.revokeSessionByToken).toHaveBeenCalledWith('session-token');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.clearCookieCalls).toHaveLength(1);
    expect(res.clearCookieCalls[0]).toMatchObject({ name: 'momentum_session' });
  });

  it('returns user for /me with valid session cookie', async () => {
    vi.mocked(authService.getUserFromSessionToken).mockResolvedValueOnce({ id: 3, email: 'user@example.com', displayName: '' });

    const meHandler = getRouteHandler(router, 'get', '/me');
    const res = await runRoute(meHandler, { cookies: { momentum_session: 'token' } });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ user: { id: 3, email: 'user@example.com', displayName: '' } });
  });

  it('returns 200 for forgot-password regardless of whether email exists', async () => {
    vi.mocked(authService.createPasswordResetToken).mockResolvedValueOnce(null);

    const handler = getRouteHandler(router, 'post', '/forgot-password');
    const res = await runRoute(handler, { body: { email: 'unknown@example.com' } });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('logs reset token when email is found for forgot-password', async () => {
    vi.mocked(authService.createPasswordResetToken).mockResolvedValueOnce({ token: 'abc123', userId: 7 });

    const handler = getRouteHandler(router, 'post', '/forgot-password');
    const res = await runRoute(handler, { body: { email: 'user@example.com' } });

    expect(authService.createPasswordResetToken).toHaveBeenCalledWith('user@example.com');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 400 for invalid forgot-password email', async () => {
    const handler = getRouteHandler(router, 'post', '/forgot-password');
    const res = await runRoute(handler, { body: { email: 'not-an-email' } });

    expect(res.statusCode).toBe(400);
    expect(authService.createPasswordResetToken).not.toHaveBeenCalled();
  });

  it('returns 200 on successful reset-password', async () => {
    vi.mocked(authService.consumePasswordResetToken).mockResolvedValueOnce(undefined);

    const handler = getRouteHandler(router, 'post', '/reset-password');
    const res = await runRoute(handler, { body: { token: 'abc123', newPassword: 'newpassword1' } });

    expect(authService.consumePasswordResetToken).toHaveBeenCalledWith('abc123', 'newpassword1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 400 for invalid or expired reset token', async () => {
    vi.mocked(authService.consumePasswordResetToken).mockRejectedValueOnce(new Error('Invalid or expired reset token'));

    const handler = getRouteHandler(router, 'post', '/reset-password');
    const res = await runRoute(handler, { body: { token: 'bad-token', newPassword: 'newpassword1' } });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid or expired reset token' });
  });

  it('returns 400 when reset token already used', async () => {
    vi.mocked(authService.consumePasswordResetToken).mockRejectedValueOnce(new Error('Reset token has already been used'));

    const handler = getRouteHandler(router, 'post', '/reset-password');
    const res = await runRoute(handler, { body: { token: 'used-token', newPassword: 'newpassword1' } });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Reset token has already been used' });
  });

  it('returns 400 for reset-password with short new password', async () => {
    const handler = getRouteHandler(router, 'post', '/reset-password');
    const res = await runRoute(handler, { body: { token: 'abc123', newPassword: 'short' } });

    expect(res.statusCode).toBe(400);
    expect(authService.consumePasswordResetToken).not.toHaveBeenCalled();
  });
});
