import pool from '../../db.js';

async function createEvent({ title, dateKey, time, description }) {
  const now = new Date();
  const result = await pool.query(
    `INSERT INTO events (title, description, event_date, event_time, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $5)
     RETURNING id, title, description, event_date::text as "dateKey",
               to_char(event_time, 'HH24:MI') as "time",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [
      String(title || '').slice(0, 256),
      description ? String(description).slice(0, 2000) : '',
      dateKey,
      time,
      now
    ]
  );
  return result.rows[0];
}

async function listEvents({ startDate, endDate } = {}) {
  if (startDate && endDate) {
    const result = await pool.query(
      `SELECT id, title, description, event_date::text as "dateKey",
              to_char(event_time, 'HH24:MI') as "time",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM events
       WHERE event_date >= $1 AND event_date <= $2
       ORDER BY event_date ASC, event_time ASC, created_at ASC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  const result = await pool.query(
    `SELECT id, title, description, event_date::text as "dateKey",
            to_char(event_time, 'HH24:MI') as "time",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM events
     ORDER BY event_date ASC, event_time ASC, created_at ASC`
  );
  return result.rows;
}

async function getEvent(id) {
  const result = await pool.query(
    `SELECT id, title, description, event_date::text as "dateKey",
            to_char(event_time, 'HH24:MI') as "time",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM events WHERE id = $1`,
    [id]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function updateEvent(id, patch) {
  const event = await getEvent(id);
  if (!event) return null;

  const title = patch.title !== undefined ? String(patch.title).slice(0, 256) : event.title;
  const description = patch.description !== undefined ? String(patch.description).slice(0, 2000) : event.description;
  const dateKey = patch.dateKey !== undefined ? patch.dateKey : event.dateKey;
  const time = patch.time !== undefined ? patch.time : event.time;
  const now = new Date();

  const result = await pool.query(
    `UPDATE events
     SET title = $1, description = $2, event_date = $3, event_time = $4, updated_at = $5
     WHERE id = $6
     RETURNING id, title, description, event_date::text as "dateKey",
               to_char(event_time, 'HH24:MI') as "time",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [title, description, dateKey, time, now, id]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

async function removeEvent(id) {
  const result = await pool.query('DELETE FROM events WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function createTask({ title, notes }) {
  const now = new Date();
  const result = await pool.query(
    'INSERT INTO tasks (title, notes, created_at, updated_at) VALUES ($1, $2, $3, $3) RETURNING id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt"',
    [String(title || '').slice(0, 256), notes ? String(notes).slice(0, 2000) : '', now]
  );
  return result.rows[0];
}

async function listTasks() {
  const result = await pool.query(
    'SELECT id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt" FROM tasks ORDER BY created_at DESC'
  );
  return result.rows;
}

async function getTask(id) {
  const result = await pool.query(
    'SELECT id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt" FROM tasks WHERE id = $1',
    [id]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function updateTask(id, patch) {
  const task = await getTask(id);
  if (!task) return null;
  
  const title = patch.title !== undefined ? String(patch.title).slice(0, 256) : task.title;
  const notes = patch.notes !== undefined ? String(patch.notes).slice(0, 2000) : task.notes;
  const done = patch.done !== undefined ? Boolean(patch.done) : task.done;
  const now = new Date();
  
  const result = await pool.query(
    'UPDATE tasks SET title = $1, notes = $2, done = $3, updated_at = $4 WHERE id = $5 RETURNING id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt"',
    [title, notes, done, now, id]
  );
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function removeTask(id) {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  return result.rowCount > 0;
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
