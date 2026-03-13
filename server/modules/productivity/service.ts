import pool from '../../db.js';

interface EventPatch {
  title?: string;
  dateKey?: string;
  time?: string;
  description?: string;
}

interface TaskPatch {
  title?: string;
  notes?: string;
  done?: boolean;
}

/** Inserts a new calendar event into the events table. Title is capped at
 *  256 chars and description at 2000 chars. Returns the created event row
 *  with dateKey as a text string and time formatted as HH:MM. */
async function createEvent({ userId, title, dateKey, time, description }: { userId: number; title: string; dateKey: string; time: string; description?: string }) {
  const now = new Date();
  const result = await pool.query(
    `INSERT INTO events (user_id, title, description, event_date, event_time, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $6)
     RETURNING id, title, description, event_date::text as "dateKey",
               to_char(event_time, 'HH24:MI') as "time",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [
      userId,
      String(title || '').slice(0, 256),
      description ? String(description).slice(0, 2000) : '',
      dateKey,
      time,
      now
    ]
  );
  return result.rows[0];
}

/** Returns all calendar events for the user ordered by date/time ascending.
 *  When both startDate and endDate are provided, only events within that
 *  inclusive date range are returned. */
async function listEvents({ userId, startDate, endDate }: { userId: number; startDate?: string; endDate?: string } = { userId: 0 }) {
  if (startDate && endDate) {
    const result = await pool.query(
      `SELECT id, title, description, event_date::text as "dateKey",
              to_char(event_time, 'HH24:MI') as "time",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM events
       WHERE user_id = $1 AND event_date >= $2 AND event_date <= $3
       ORDER BY event_date ASC, event_time ASC, created_at ASC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  }

  const result = await pool.query(
    `SELECT id, title, description, event_date::text as "dateKey",
            to_char(event_time, 'HH24:MI') as "time",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM events
     WHERE user_id = $1
     ORDER BY event_date ASC, event_time ASC, created_at ASC`,
    [userId]
  );
  return result.rows;
}

/** Fetches a single event by ID scoped to the user. Returns null if the
 *  event does not exist or belongs to a different user. */
async function getEvent({ userId, id }: { userId: number; id: number | string }) {
  const result = await pool.query(
    `SELECT id, title, description, event_date::text as "dateKey",
            to_char(event_time, 'HH24:MI') as "time",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM events WHERE user_id = $1 AND id = $2`,
    [userId, id]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Fetches the existing event to merge defaults, then writes the updated
 *  title, description, date, and time in a single UPDATE. Omitted patch
 *  fields retain their current value. Returns null if the event is not found. */
async function updateEvent({ userId, id, patch }: { userId: number; id: number | string; patch: EventPatch }) {
  const event = await getEvent({ userId, id });
  if (!event) return null;

  const title = patch.title !== undefined ? String(patch.title).slice(0, 256) : event.title;
  const description = patch.description !== undefined ? String(patch.description).slice(0, 2000) : event.description;
  const dateKey = patch.dateKey !== undefined ? patch.dateKey : event.dateKey;
  const time = patch.time !== undefined ? patch.time : event.time;
  const now = new Date();

  const result = await pool.query(
    `UPDATE events
     SET title = $1, description = $2, event_date = $3, event_time = $4, updated_at = $5
     WHERE user_id = $6 AND id = $7
     RETURNING id, title, description, event_date::text as "dateKey",
               to_char(event_time, 'HH24:MI') as "time",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [title, description, dateKey, time, now, userId, id]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Deletes an event by ID scoped to the user. Returns true if a row was
 *  deleted, false if the event was not found. */
async function removeEvent({ userId, id }: { userId: number; id: number | string }) {
  const result = await pool.query('DELETE FROM events WHERE user_id = $1 AND id = $2', [userId, id]);
  return (result.rowCount ?? 0) > 0;
}

/** Inserts a new task with the given title and optional notes. Title is
 *  capped at 256 chars, notes at 2000 chars. The task starts with done=false.
 *  Returns the created task row. */
async function createTask({ userId, title, notes }: { userId: number; title: string; notes?: string }) {
  const now = new Date();
  const result = await pool.query(
    'INSERT INTO tasks (user_id, title, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) RETURNING id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt"',
    [userId, String(title || '').slice(0, 256), notes ? String(notes).slice(0, 2000) : '', now]
  );
  return result.rows[0];
}

/** Returns all tasks for the user ordered newest-first, including title,
 *  notes, and completion status. */
async function listTasks({ userId }: { userId: number }) {
  const result = await pool.query(
    'SELECT id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt" FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

/** Fetches a single task by ID scoped to the user. Returns null if the
 *  task does not exist or belongs to a different user. */
async function getTask({ userId, id }: { userId: number; id: number | string }) {
  const result = await pool.query(
    'SELECT id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt" FROM tasks WHERE user_id = $1 AND id = $2',
    [userId, id]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Fetches the existing task to merge defaults, then writes the updated
 *  title, notes, and done flag in a single UPDATE. Omitted patch fields
 *  retain their current value. Returns null if the task is not found. */
async function updateTask({ userId, id, patch }: { userId: number; id: number | string; patch: TaskPatch }) {
  const task = await getTask({ userId, id });
  if (!task) return null;

  const title = patch.title !== undefined ? String(patch.title).slice(0, 256) : task.title;
  const notes = patch.notes !== undefined ? String(patch.notes).slice(0, 2000) : task.notes;
  const done = patch.done !== undefined ? Boolean(patch.done) : task.done;
  const now = new Date();

  const result = await pool.query(
    'UPDATE tasks SET title = $1, notes = $2, done = $3, updated_at = $4 WHERE user_id = $5 AND id = $6 RETURNING id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt"',
    [title, notes, done, now, userId, id]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Deletes a task by ID scoped to the user. Returns true if a row was
 *  deleted, false if the task was not found. */
async function removeTask({ userId, id }: { userId: number; id: number | string }) {
  const result = await pool.query('DELETE FROM tasks WHERE user_id = $1 AND id = $2', [userId, id]);
  return (result.rowCount ?? 0) > 0;
}

export default {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  removeEvent,
  createTask,
  listTasks,
  getTask,
  updateTask,
  removeTask
};
