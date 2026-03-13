import pool from '../../db.js';

interface SleepRow {
  id: number;
  startTime: string;
  endTime: string;
  quality: number | string;
  notes: string | null;
  createdAt: string | Date;
}

let sleepTableReadyPromise: Promise<void> | null = null;

/** Lazily creates the sleep_sessions table and its indexes on first call.
 *  Subsequent calls return the cached promise so the DDL only runs once per
 *  process. Resets the cached promise on failure so it can be retried. */
function ensureSleepTableReady(): Promise<void> {
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

/** Maps a raw sleep_sessions database row to the public session shape,
 *  computing durationHours from the difference between endTime and startTime.
 *  Returns null for null input. */
function toSleepSession(row: SleepRow | null) {
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

/** Ensures the table exists, then inserts a new sleep session. quality is
 *  clamped to [1, 5] and defaults to 3; notes are capped at 500 chars.
 *  Returns the created session via toSleepSession (includes durationHours). */
export async function addSleepSession({ userId, startTime, endTime, quality, notes }: { userId: number; startTime: string; endTime: string; quality?: number; notes?: string }) {
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

/** Returns the user's sleep sessions ordered newest-first. limit is clamped
 *  to [1, 120] and defaults to 30. Each row is mapped through toSleepSession
 *  to include the computed durationHours field. */
export async function listSleepSessions({ userId, limit = 30 }: { userId: number; limit?: number }) {
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

/** Deletes a sleep session by ID scoped to the user. Returns true if a row
 *  was deleted, false if the session was not found. */
export async function deleteSleepSession({ userId, id }: { userId: number; id: number | string }) {
  await ensureSleepTableReady();
  const result = await pool.query(
    'DELETE FROM sleep_sessions WHERE user_id = $1 AND id = $2 RETURNING id',
    [userId, id]
  );

  return (result.rowCount ?? 0) > 0;
}

/** Fetches all sessions within the last N days (clamped to [3, 90], default
 *  7) and calculates: session count, average duration in hours, and average
 *  quality score (1–5). Also includes the most recent session or null if
 *  there are no sessions in the window. */
export async function getSleepSummary({ userId, days = 7 }: { userId: number; days?: number }) {
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

  const sessions = result.rows.map(toSleepSession).filter((s): s is NonNullable<ReturnType<typeof toSleepSession>> => s !== null);
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
