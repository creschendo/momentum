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

// ── Profile ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  dateOfBirth?: string;
  sex?: string;
  heightCm?: number;
  createdAt?: string | Date;
}

interface ProfileRow extends UserRow {
  date_of_birth?: string | null;
  sex?: string | null;
  height_cm?: string | null;
}

function toProfileUser(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name || '',
    createdAt: row.created_at,
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth).slice(0, 10) : undefined,
    sex: row.sex || undefined,
    heightCm: row.height_cm ? Number(row.height_cm) : undefined
  };
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const result = await pool.query(
    'SELECT id, email, display_name, date_of_birth, sex, height_cm, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (!result.rows[0]) throw new Error('User not found');
  return toProfileUser(result.rows[0]);
}

export async function updateUserProfile(
  userId: number,
  { displayName, dateOfBirth, sex, heightCm }: { displayName?: string; dateOfBirth?: string | null; sex?: string | null; heightCm?: number | null }
): Promise<UserProfile> {
  const result = await pool.query(
    `UPDATE users
     SET display_name = $2,
         date_of_birth = $3::date,
         sex = $4,
         height_cm = $5::numeric,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, display_name, date_of_birth, sex, height_cm, created_at`,
    [userId, displayName || null, dateOfBirth || null, sex || null, heightCm ?? null]
  );
  if (!result.rows[0]) throw new Error('User not found');
  return toProfileUser(result.rows[0]);
}

// ── Account ───────────────────────────────────────────────────────────────────

export async function updateUserEmail(userId: number, newEmail: string, password: string): Promise<User> {
  const check = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (!check.rows[0]) throw new Error('User not found');
  const valid = await bcrypt.compare(String(password), check.rows[0].password_hash);
  if (!valid) throw new Error('Invalid password');

  const normalizedEmail = normalizeEmail(newEmail);
  const result = await pool.query(
    'UPDATE users SET email = $2, updated_at = NOW() WHERE id = $1 RETURNING id, email, display_name, created_at',
    [userId, normalizedEmail]
  );
  return toPublicUser(result.rows[0]) as User;
}

export async function updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
  const check = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (!check.rows[0]) throw new Error('User not found');
  const valid = await bcrypt.compare(String(currentPassword), check.rows[0].password_hash);
  if (!valid) throw new Error('Invalid current password');

  const newHash = await bcrypt.hash(String(newPassword), PASSWORD_ROUNDS);
  await pool.query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1', [userId, newHash]);
}

export async function deleteUserAccount(userId: number, password: string): Promise<void> {
  const check = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (!check.rows[0]) throw new Error('User not found');
  const valid = await bcrypt.compare(String(password), check.rows[0].password_hash);
  if (!valid) throw new Error('Invalid password');

  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface SessionInfo {
  id: number;
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
  isCurrent: boolean;
}

export async function listUserSessions(userId: number, currentToken: string | undefined): Promise<SessionInfo[]> {
  const currentHash = currentToken ? hashSessionToken(currentToken) : null;
  const result = await pool.query(
    `SELECT id, user_agent, ip_address, created_at, token_hash
     FROM user_sessions
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    userAgent: row.user_agent || '',
    ipAddress: row.ip_address || '',
    createdAt: row.created_at,
    isCurrent: row.token_hash === currentHash
  }));
}

export async function revokeSessionById(userId: number, sessionId: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE user_sessions SET revoked_at = NOW()
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [sessionId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}
