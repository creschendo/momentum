import { describe, it, expect } from 'vitest';
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  createUser,
  verifyUserCredentials,
  createSession,
  getUserFromSessionToken,
  revokeSessionByToken
} from '../service.js';

describe('auth service scaffolding', () => {
  it('exposes expected API', () => {
    expect(SESSION_COOKIE_NAME).toBe('momentum_session');
    expect(typeof getSessionCookieOptions).toBe('function');
    expect(typeof createUser).toBe('function');
    expect(typeof verifyUserCredentials).toBe('function');
    expect(typeof createSession).toBe('function');
    expect(typeof getUserFromSessionToken).toBe('function');
    expect(typeof revokeSessionByToken).toBe('function');
  });

  it('returns cookie options shape', () => {
    const options = getSessionCookieOptions();
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    });
    expect(typeof options.maxAge).toBe('number');
  });

  it.todo('creates a user and returns public profile');
  it.todo('verifies credentials for a known user');
  it.todo('creates and revokes session tokens');
});
