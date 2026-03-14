// Productivity API — task management (create, read, update, delete).

/** A to-do task with an optional notes field and completion state. */
export interface Task {
  id: number | string;
  title: string;
  notes?: string;
  done: boolean;
}

/** Returns all tasks for the authenticated user. */
export async function getTasks(): Promise<Task[]> {
  const res = await fetch('/api/productivity/tasks');
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json() as Promise<Task[]>;
}

/** Creates a new task. Throws with the server's error message on validation failure. */
export async function createTask({ title, notes }: { title: string; notes?: string }): Promise<Task> {
  const res = await fetch('/api/productivity/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, notes })
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || 'Failed to create task');
  }
  return res.json() as Promise<Task>;
}

/** Partially updates a task's title, notes, or done state. Only provided fields are changed. */
export async function patchTask(id: number | string, patch: Partial<Pick<Task, 'title' | 'notes' | 'done'>>): Promise<Task> {
  const res = await fetch(`/api/productivity/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || 'Failed to update task');
  }
  return res.json() as Promise<Task>;
}

/** Deletes a task by ID. Treats 204 No Content as success. */
export async function deleteTask(id: number | string): Promise<true> {
  const res = await fetch(`/api/productivity/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete task');
  return true;
}
