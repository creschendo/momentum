import pool from '../../db.js';

async function createEvent({ userId, title, dateKey, time, description }) {
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

async function listEvents({ userId, startDate, endDate } = {}) {
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
     ORDER BY event_date ASC, event_time ASC, created_at ASC`
    ,
    [userId]
  );
  return result.rows;
}

async function getEvent({ userId, id }) {
  const result = await pool.query(
    `SELECT id, title, description, event_date::text as "dateKey",
            to_char(event_time, 'HH24:MI') as "time",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM events WHERE user_id = $1 AND id = $2`,
    [userId, id]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function updateEvent({ userId, id, patch }) {
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

async function removeEvent({ userId, id }) {
  const result = await pool.query('DELETE FROM events WHERE user_id = $1 AND id = $2', [userId, id]);
  return result.rowCount > 0;
}

async function createTask({ userId, title, notes }) {
  const now = new Date();
  const result = await pool.query(
    'INSERT INTO tasks (user_id, title, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) RETURNING id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt"',
    [userId, String(title || '').slice(0, 256), notes ? String(notes).slice(0, 2000) : '', now]
  );
  return result.rows[0];
}

async function listTasks({ userId }) {
  const result = await pool.query(
    'SELECT id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt" FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function getTask({ userId, id }) {
  const result = await pool.query(
    'SELECT id, title, notes, done, created_at as "createdAt", updated_at as "updatedAt" FROM tasks WHERE user_id = $1 AND id = $2',
    [userId, id]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function updateTask({ userId, id, patch }) {
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

async function removeTask({ userId, id }) {
  const result = await pool.query('DELETE FROM tasks WHERE user_id = $1 AND id = $2', [userId, id]);
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
