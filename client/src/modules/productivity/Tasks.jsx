import React, { useState } from 'react';
import useTasks from './hooks/useTasks';
import { useTheme } from '../../context/ThemeContext';

export default function Tasks() {
  const { theme } = useTheme();
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
    <div style={{ marginTop: 24, padding: '24px', backgroundColor: theme.bgSecondary, borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, color: theme.text }}>Tasks</h3>
      
      <form onSubmit={onAdd} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <input 
          placeholder="Task title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '10px 12px',
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            fontSize: 14,
            fontFamily: 'inherit',
            backgroundColor: theme.bg,
            color: theme.text
          }}
        />
        <input 
          placeholder="Notes (optional)" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '10px 12px',
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            fontSize: 14,
            fontFamily: 'inherit',
            backgroundColor: theme.bg,
            color: theme.text
          }}
        />
        <button 
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#48bb78',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 200ms',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#38a169')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#48bb78')}
        >
          Add Task
        </button>
      </form>

      {loading && <div style={{ fontSize: 14, color: theme.textMuted }}>Loading...</div>}
      {error && <div style={{ color: theme.error, fontSize: 14, padding: 10, backgroundColor: theme.errorBg, borderRadius: 4, marginBottom: 16 }}>Error: {error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((t) => (
          <div 
            key={t.id} 
            style={{ 
              display: 'flex', 
              gap: 12, 
              alignItems: 'flex-start',
              padding: '12px',
              backgroundColor: theme.bg,
              borderRadius: 6,
              border: `1px solid ${theme.border}`,
              transition: 'all 200ms'
            }}
          >
            <input 
              type="checkbox" 
              checked={!!t.done} 
              onChange={(e) => toggleDone(t.id, e.target.checked)}
              style={{
                marginTop: 4,
                cursor: 'pointer',
                width: 18,
                height: 18
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 600,
                color: t.done ? theme.textMuted : theme.text,
                textDecoration: t.done ? 'line-through' : 'none',
                transition: 'all 200ms'
              }}>
                {t.title}
              </div>
              {t.notes && <div style={{ fontSize: '0.9rem', color: theme.textMuted, marginTop: 4 }}>{t.notes}</div>}
            </div>
            <button 
              onClick={() => remove(t.id)}
              style={{
                padding: '6px 12px',
                backgroundColor: theme.errorBg,
                color: theme.error,
                border: `1px solid ${theme.error}`,
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = theme.error;
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = theme.errorBg;
                e.target.style.color = theme.error;
              }}
            >
              Delete
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div style={{ fontSize: 14, color: theme.textMuted, padding: 12, textAlign: 'center' }}>
            No tasks yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
