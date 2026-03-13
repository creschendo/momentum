import pool from '../../db.js';

interface NotePatch {
  title?: string;
  content?: string;
}

/** Inserts a new note. title is required (capped at 256 chars), content
 *  is optional (capped at 10000 chars). Returns the created row. */
async function createNote({ userId, title, content }: { userId: number; title: string; content?: string }) {
  const now = new Date();
  const result = await pool.query(
    `INSERT INTO notes (user_id, title, content, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $4)
     RETURNING id, title, content, created_at as "createdAt", updated_at as "updatedAt"`,
    [userId, String(title).slice(0, 256), content ? String(content).slice(0, 10000) : '', now]
  );
  return result.rows[0];
}

/** Returns all notes for the user ordered newest-first. */
async function listNotes({ userId }: { userId: number }) {
  const result = await pool.query(
    `SELECT id, title, content, created_at as "createdAt", updated_at as "updatedAt"
     FROM notes WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

/** Fetches a single note by ID scoped to the user. Returns null if not found. */
async function getNote({ userId, id }: { userId: number; id: number | string }) {
  const result = await pool.query(
    `SELECT id, title, content, created_at as "createdAt", updated_at as "updatedAt"
     FROM notes WHERE user_id = $1 AND id = $2`,
    [userId, id]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Merges patch fields into the existing note and writes a single UPDATE.
 *  Omitted patch fields retain their current value. Returns null if not found. */
async function updateNote({ userId, id, patch }: { userId: number; id: number | string; patch: NotePatch }) {
  const note = await getNote({ userId, id });
  if (!note) return null;

  const title = patch.title !== undefined ? String(patch.title).slice(0, 256) : note.title;
  const content = patch.content !== undefined ? String(patch.content).slice(0, 10000) : note.content;
  const now = new Date();

  const result = await pool.query(
    `UPDATE notes SET title = $1, content = $2, updated_at = $3
     WHERE user_id = $4 AND id = $5
     RETURNING id, title, content, created_at as "createdAt", updated_at as "updatedAt"`,
    [title, content, now, userId, id]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/** Deletes a note by ID scoped to the user. Returns true if a row was deleted. */
async function removeNote({ userId, id }: { userId: number; id: number | string }) {
  const result = await pool.query('DELETE FROM notes WHERE user_id = $1 AND id = $2', [userId, id]);
  return (result.rowCount ?? 0) > 0;
}

export default { createNote, listNotes, getNote, updateNote, removeNote };
