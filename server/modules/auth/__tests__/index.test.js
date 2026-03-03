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
  revokeSessionByToken: vi.fn()
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
    authService.createUser.mockResolvedValueOnce({ id: 7, email: 'user@example.com', displayName: 'User' });
    authService.createSession.mockResolvedValueOnce({ token: 'session-token' });

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
    authService.verifyUserCredentials.mockResolvedValueOnce(null);

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
    authService.getUserFromSessionToken.mockResolvedValueOnce(null);

    const meHandler = getRouteHandler(router, 'get', '/me');
    const res = await runRoute(meHandler, { cookies: {} });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });
});
