// @ts-check
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../../db.js';

/** @typedef {import('../../types').User} User */
/** @typedef {import('../../types').AuthSession} AuthSession */

export const SESSION_COOKIE_NAME = 'momentum_session';
const SESSION_DURATION_DAYS = 30;
const PASSWORD_ROUNDS = 10;

/**
 * @param {unknown} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * @param {{id:number,email:string,display_name?:string,created_at?:string|Date}|undefined|null} row
 * @returns {User|null}
 */
function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name || '',
    createdAt: row.created_at
  };
}

/**
 * @param {string} token
 * @returns {string}
 */
function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * @returns {import('express').CookieOptions}
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  };
}

/**
 * @param {{email:string,password:string,displayName?:string}} params
 * @returns {Promise<User>}
 */
export async function createUser({ email, password, displayName }) {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await bcrypt.hash(String(password), PASSWORD_ROUNDS);
  const now = new Date();

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, display_name, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $4)
     RETURNING id, email, display_name, created_at`,
    [normalizedEmail, passwordHash, String(displayName || '').slice(0, 120), now]
  );

  return /** @type {User} */ (toPublicUser(result.rows[0]));
}

/**
 * @param {{email:string,password:string}} params
 * @returns {Promise<User|null>}
 */
export async function verifyUserCredentials({ email, password }) {
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

/**
 * @param {{userId:number,userAgent?:string,ipAddress?:string}} params
 * @returns {Promise<AuthSession & {expiresAt: Date}>}
 */
export async function createSession({ userId, userAgent, ipAddress }) {
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

/**
 * @param {string|undefined|null} token
 * @returns {Promise<User|null>}
 */
export async function getUserFromSessionToken(token) {
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

/**
 * @param {string|undefined|null} token
 * @returns {Promise<void>}
 */
export async function revokeSessionByToken(token) {
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
