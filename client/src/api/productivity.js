// Thin API wrapper for productivity tasks
export async function getTasks() {
  const res = await fetch('/api/productivity/tasks');
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask({ title, notes }) {
  const res = await fetch('/api/productivity/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, notes }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create task');
  return res.json();
}

export async function patchTask(id, patch) {
  const res = await fetch(`/api/productivity/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update task');
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`/api/productivity/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete task');
  return true;
}
