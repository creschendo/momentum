export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export async function getNotes(): Promise<Note[]> {
  const res = await fetch('/api/notes', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
}

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

export async function deleteNote(id: number): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || 'Failed to delete note');
  }
}
