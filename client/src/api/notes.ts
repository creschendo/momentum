// Notes API — CRUD for freeform notes. All requests use `credentials: 'include'` to send the session cookie.

/** A persisted note with title, rich-text content, and server-managed timestamps. */
export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Returns all notes for the authenticated user, ordered by most recently updated. */
export async function getNotes(): Promise<Note[]> {
  const res = await fetch('/api/notes', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
}

/** Creates a new note with the given title and content. */
export async function createNote(title: string, content: string): Promise<Note> {
  const res = await fetch('/api/notes', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || 'Failed to create note');
  }
  return res.json();
}

/** Updates the title and content of an existing note. updatedAt is refreshed server-side. */
export async function updateNote(id: number, title: string, content: string): Promise<Note> {
  const res = await fetch(`/api/notes/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || 'Failed to update note');
  }
  return res.json();
}

/** Permanently deletes a note by ID. */
export async function deleteNote(id: number): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || 'Failed to delete note');
  }
}
