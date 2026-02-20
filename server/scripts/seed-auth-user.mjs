import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const DEFAULT_EMAIL = 'demo@momentum.local';
const DEFAULT_PASSWORD = 'demo12345';
const DEFAULT_DISPLAY_NAME = 'Demo User';
const ROUNDS = 10;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function run() {
  const email = normalizeEmail(process.env.SEED_USER_EMAIL || DEFAULT_EMAIL);
  const password = String(process.env.SEED_USER_PASSWORD || DEFAULT_PASSWORD);
  const displayName = String(process.env.SEED_USER_DISPLAY_NAME || DEFAULT_DISPLAY_NAME).slice(0, 120);

  if (!email.includes('@')) {
    throw new Error('SEED_USER_EMAIL must be a valid email address');
  }
  if (password.length < 8) {
    throw new Error('SEED_USER_PASSWORD must be at least 8 characters');
  }

  const passwordHash = await bcrypt.hash(password, ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, display_name, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (email)
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       display_name = EXCLUDED.display_name,
       updated_at = NOW()
     RETURNING id, email, display_name`,
    [email, passwordHash, displayName]
  );

  const user = result.rows[0];
  console.log(`Seeded auth user: ${user.email} (id=${user.id}, name=${user.display_name || ''})`);
}

run()
  .catch((err) => {
    console.error('Failed to seed auth user:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
