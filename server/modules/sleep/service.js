import pool from '../../db.js';

let sleepTableReadyPromise = null;

function ensureSleepTableReady() {
  if (!sleepTableReadyPromise) {
    sleepTableReadyPromise = (async () => {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS sleep_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          quality SMALLINT NOT NULL DEFAULT 3 CHECK (quality >= 1 AND quality <= 5),
          notes VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      );
      await pool.query('CREATE INDEX IF NOT EXISTS idx_sleep_sessions_user_start ON sleep_sessions(user_id, start_time DESC)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_sleep_sessions_created_at ON sleep_sessions(created_at)');
    })().catch((err) => {
      sleepTableReadyPromise = null;
      throw err;
    });
  }

  return sleepTableReadyPromise;
}

function toSleepSession(row) {
  if (!row) return null;

  const startDate = new Date(row.startTime);
  const endDate = new Date(row.endTime);
  const durationMs = Math.max(0, endDate.getTime() - startDate.getTime());
  const durationHours = Number((durationMs / (1000 * 60 * 60)).toFixed(2));

  return {
    id: row.id,
    startTime: row.startTime,
    endTime: row.endTime,
    quality: Number(row.quality),
    notes: row.notes || '',
    createdAt: row.createdAt,
    durationHours
  };
}

export async function addSleepSession({ userId, startTime, endTime, quality, notes }) {
  await ensureSleepTableReady();
  const safeQuality = Math.max(1, Math.min(5, Number(quality) || 3));
  const safeNotes = notes ? String(notes).slice(0, 500) : '';

  const result = await pool.query(
    `INSERT INTO sleep_sessions (user_id, start_time, end_time, quality, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, start_time as "startTime", end_time as "endTime", quality, notes, created_at as "createdAt"`,
    [userId, startTime, endTime, safeQuality, safeNotes]
  );

  return toSleepSession(result.rows[0]);
}

export async function listSleepSessions({ userId, limit = 30 }) {
  await ensureSleepTableReady();
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(120, Number(limit))) : 30;

  const result = await pool.query(
    `SELECT id, start_time as "startTime", end_time as "endTime", quality, notes, created_at as "createdAt"
     FROM sleep_sessions
     WHERE user_id = $1
     ORDER BY start_time DESC
     LIMIT $2`,
    [userId, safeLimit]
  );

  return result.rows.map(toSleepSession);
}

export async function deleteSleepSession({ userId, id }) {
  await ensureSleepTableReady();
  const result = await pool.query(
    'DELETE FROM sleep_sessions WHERE user_id = $1 AND id = $2 RETURNING id',
    [userId, id]
  );

  return result.rowCount > 0;
}

export async function getSleepSummary({ userId, days = 7 }) {
  await ensureSleepTableReady();
  const safeDays = Number.isFinite(days) ? Math.max(3, Math.min(90, Number(days))) : 7;

  const result = await pool.query(
    `SELECT id, start_time as "startTime", end_time as "endTime", quality, notes, created_at as "createdAt"
     FROM sleep_sessions
     WHERE user_id = $1
       AND start_time >= (NOW() - ($2::int || ' days')::interval)
     ORDER BY start_time DESC`,
    [userId, safeDays]
  );

  const sessions = result.rows.map(toSleepSession);
  const durationValues = sessions
    .map((session) => session.durationHours)
    .filter((value) => Number.isFinite(value) && value > 0);
  const qualityValues = sessions
    .map((session) => Number(session.quality))
    .filter((value) => Number.isFinite(value));

  const avgDurationHours = durationValues.length
    ? Number((durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length).toFixed(2))
    : 0;

  const avgQuality = qualityValues.length
    ? Number((qualityValues.reduce((sum, value) => sum + value, 0) / qualityValues.length).toFixed(1))
    : 0;

  return {
    days: safeDays,
    count: sessions.length,
    avgDurationHours,
    avgQuality,
    latest: sessions[0] || null
  };
}

export default {
  addSleepSession,
  listSleepSessions,
  deleteSleepSession,
  getSleepSummary
};
