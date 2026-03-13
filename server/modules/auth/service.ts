import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { CookieOptions } from 'express';
import pool from '../../db.js';
import type { User, AuthSession } from '../../types.js';

export const SESSION_COOKIE_NAME = 'momentum_session';
const SESSION_DURATION_DAYS = 30;
const PASSWORD_ROUNDS = 10;

interface UserRow {
  id: number;
  email: string;
  display_name?: string;
  created_at?: string | Date;
}

/** Trims whitespace and lowercases the email to ensure consistent storage
 *  and lookup regardless of how the user typed it. */
function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

/** Maps a raw database row to the public-safe User shape, omitting
 *  sensitive fields like password_hash. Returns null for missing rows. */
function toPublicUser(row: UserRow | undefined | null): User | null {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name || '',
    createdAt: row.created_at
  };
}

/** Produces a SHA-256 hex digest of a session token so that only the hash
 *  is persisted in the database — the plaintext token is never stored. */
function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Returns Express cookie options for the session cookie. The cookie is
 *  HttpOnly and SameSite=lax; Secure is enabled in production. Expires after
 *  SESSION_DURATION_DAYS days. */
export function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  };
}

/** Creates a new user in the database. Normalizes the email, hashes the
 *  password with bcrypt (10 rounds), and returns the public user object.
 *  Throws a PostgreSQL unique-violation error (code 23505) if the email
 *  is already in use. */
export async function createUser({ email, password, displayName }: { email: string; password: string; displayName?: string }): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await bcrypt.hash(String(password), PASSWORD_ROUNDS);
  const now = new Date();

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, display_name, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $4)
     RETURNING id, email, display_name, created_at`,
    [normalizedEmail, passwordHash, String(displayName || '').slice(0, 120), now]
  );

  return toPublicUser(result.rows[0]) as User;
}

/** Looks up a user by normalized email and compares the provided plaintext
 *  password against the stored bcrypt hash. Returns the public user object
 *  on a match, or null if the email does not exist or the password is wrong. */
export async function verifyUserCredentials({ email, password }: { email: string; password: string }): Promise<User | null> {
  const normalizedEmail = normalizeEmail(email);
  const result = await pool.query(
    `SELECT id, email, display_name, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const row = result.rows[0];
  if (!row) return null;

  const valid = await bcrypt.compare(String(password || ''), row.password_hash);
  if (!valid) return null;

  return toPublicUser(row);
}

/** Generates a cryptographically random 32-byte session token, stores only
 *  its SHA-256 hash in the database alongside the userId, user-agent, and IP,
 *  and returns the plaintext token (sent to the client via cookie). */
export async function createSession({ userId, userAgent, ipAddress }: { userId: number; userAgent?: string; ipAddress?: string }): Promise<AuthSession & { expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO user_sessions (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, String(userAgent || '').slice(0, 1024), String(ipAddress || '').slice(0, 64), expiresAt]
  );

  return { userId, token, expiresAt };
}

/** Resolves a plaintext session token to its owner. Hashes the token,
 *  then joins user_sessions and users, filtering out revoked and expired
 *  sessions. Returns null if the token is absent or invalid. */
export async function getUserFromSessionToken(token: string | undefined | null): Promise<User | null> {
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const result = await pool.query(
    `SELECT u.id, u.email, u.display_name, u.created_at
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  return toPublicUser(result.rows[0]);
}

/** Marks an active session as revoked by setting revoked_at to NOW().
 *  Subsequent calls to getUserFromSessionToken with the same token will
 *  return null. No-ops if the token is missing or already revoked. */
export async function revokeSessionByToken(token: string | undefined | null): Promise<void> {
  if (!token) return;

  const tokenHash = hashSessionToken(token);
  await pool.query(
    `UPDATE user_sessions
     SET revoked_at = NOW()
     WHERE token_hash = $1
       AND revoked_at IS NULL`,
    [tokenHash]
  );
}
