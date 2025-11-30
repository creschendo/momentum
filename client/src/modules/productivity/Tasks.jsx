import React, { useState } from 'react';
import useTasks from './hooks/useTasks';

export default function Tasks() {
  const { tasks, loading, error, addTask, toggleDone, remove } = useTasks();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  async function onAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await addTask({ title: title.trim(), notes });
      setTitle('');
      setNotes('');
    } catch (err) {
      // handled by hook
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <h3>Tasks</h3>
      <form onSubmit={onAdd} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: '#9b2c2c' }}>Error: {error}</div>}

      <ul>
        {tasks.map((t) => (
          <li key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={!!t.done} onChange={(e) => toggleDone(t.id, e.target.checked)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{t.title}</div>
              {t.notes && <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>{t.notes}</div>}
            </div>
            <button onClick={() => remove(t.id)}>Delete</button>
          </li>
        ))}
        {tasks.length === 0 && <li>No tasks yet</li>}
      </ul>
    </div>
  );
}
