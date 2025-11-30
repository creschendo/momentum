// In-memory task service for the productivity module.
// Replace with DB-backed repo for production.

const tasks = [];

function createTask({ title, notes }) {
  const now = new Date();
  const task = {
    id: String(Date.now()) + Math.random().toString(36).slice(2),
    title: String(title || '').slice(0, 256),
    notes: notes ? String(notes).slice(0, 2000) : '',
    done: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  tasks.push(task);
  return task;
}

function listTasks() {
  // return newest first
  return [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getTask(id) {
  return tasks.find((t) => t.id === id) || null;
}

function updateTask(id, patch) {
  const t = getTask(id);
  if (!t) return null;
  if (patch.title !== undefined) t.title = String(patch.title).slice(0, 256);
  if (patch.notes !== undefined) t.notes = String(patch.notes).slice(0, 2000);
  if (patch.done !== undefined) t.done = Boolean(patch.done);
  t.updatedAt = new Date().toISOString();
  return t;
}

function removeTask(id) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  tasks.splice(idx, 1);
  return true;
}

export default { createTask, listTasks, getTask, updateTask, removeTask };
