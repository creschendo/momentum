import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import pool from '../../../db.js';
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  createUser,
  verifyUserCredentials,
  createSession,
  getUserFromSessionToken,
  revokeSessionByToken
} from '../service.js';

vi.mock('../../../db.js', () => ({
  default: {
    query: vi.fn()
  }
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn()
  }
}));

describe('auth service scaffolding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NODE_ENV;
  });

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

  it('enables secure cookies in production mode', () => {
    process.env.NODE_ENV = 'production';

    const options = getSessionCookieOptions();
    expect(options.secure).toBe(true);
  });

  it('creates a user and returns public profile', async () => {
    vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password' as never);
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          email: 'test@example.com',
          display_name: 'Tester',
          created_at: '2026-03-02T00:00:00.000Z'
        }
      ]
    } as any);

    const user = await createUser({ email: ' Test@Example.com ', password: 'password123', displayName: 'Tester' });

    expect(bcrypt.hash).toHaveBeenCalled();
    expect(pool.query).toHaveBeenCalled();
    expect(user).toEqual({
      id: 1,
      email: 'test@example.com',
      displayName: 'Tester',
      createdAt: '2026-03-02T00:00:00.000Z'
    });
  });

  it('verifies credentials for a known user', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          email: 'user@example.com',
          display_name: 'Known User',
          password_hash: 'hash',
          created_at: '2026-03-02T00:00:00.000Z'
        }
      ]
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

    const user = await verifyUserCredentials({ email: 'user@example.com', password: 'password123' });

    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hash');
    expect(user).toEqual({
      id: 2,
      email: 'user@example.com',
      displayName: 'Known User',
      createdAt: '2026-03-02T00:00:00.000Z'
    });
  });

  it('returns null when credentials lookup misses user', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

    const user = await verifyUserCredentials({ email: 'missing@example.com', password: 'password123' });
    expect(user).toBeNull();
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('returns null when session token is missing', async () => {
    const user = await getUserFromSessionToken('');
    expect(user).toBeNull();
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('does nothing when revoking without token', async () => {
    await revokeSessionByToken('');
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('creates and revokes session tokens', async () => {
    vi.spyOn(crypto, 'randomBytes').mockReturnValueOnce(Buffer.from('a'.repeat(32)) as any);
    vi.mocked(pool.query).mockResolvedValueOnce({ rowCount: 1 } as any);
    vi.mocked(pool.query).mockResolvedValueOnce({ rowCount: 1 } as any);

    const session = await createSession({ userId: 3, userAgent: 'vitest', ipAddress: '127.0.0.1' });
    expect(typeof session.token).toBe('string');
    expect(session.token.length).toBeGreaterThan(0);
    expect(pool.query).toHaveBeenCalledTimes(1);

    await revokeSessionByToken(session.token);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});
