import { Pool } from 'pg';
import logger from './logger.js';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'momentum'
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle DB client');
});

export default pool;
