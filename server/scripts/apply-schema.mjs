import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');

  if (!sql || sql.trim().length === 0) {
    throw new Error('schema.sql is empty');
  }

  await pool.query(sql);
  console.log('Applied server/schema.sql successfully');
}

run()
  .catch((err) => {
    console.error('Failed to apply schema:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
