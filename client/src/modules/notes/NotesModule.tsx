import React, { useEffect, useRef, useState } from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import { useTheme } from '../../context/ThemeContext';
import { createNote, deleteNote, getNotes, updateNote, Note } from '../../api/notes';

const MAX_PREVIEW_LENGTH = 120;

export default function NotesModule() {
  const { theme } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // search
  const [query, setQuery] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);

  const loadNotes = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await getNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notes');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { loadNotes(); }, []);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      if (editingId !== null) {
        await updateNote(editingId, title, content);
      } else {
        await createNote(title, content);
      }
      resetForm();
      await loadNotes({ silent: true });
    } catch (err: any) {
      setError(err.message || 'Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    titleRef.current?.focus();
  };

  const handleDelete = async (id: number) => {
    setError('');
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editingId === id) resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to delete note');
    }
  };

  const filtered = query.trim()
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.content.toLowerCase().includes(query.toLowerCase())
      )
    : notes;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: `1px solid ${theme.border}`,
    borderRadius: 6,
    backgroundColor: theme.bg,
    color: theme.text,
    fontSize: 13,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none'
  };

  return (
    <div>
      <ModuleContainer moduleKey="notes" title="Notes" description="Quick notes and personal journal entries." />

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* compose / edit form */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: theme.bgSecondary,
            border: `1px solid ${editingId !== null ? theme.primary : theme.border}`,
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
            maxLength={256}
            style={{ ...inputStyle, fontWeight: 600 }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something…"
            rows={4}
            maxLength={10000}
            style={{
              ...inputStyle,
              resize: 'vertical',
              lineHeight: 1.5,
              minHeight: 80
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              style={{
                padding: '7px 14px',
                backgroundColor: theme.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting || !title.trim() ? 'default' : 'pointer',
                opacity: submitting || !title.trim() ? 0.6 : 1,
                fontFamily: 'inherit'
              }}
            >
              {submitting ? 'Saving…' : editingId !== null ? 'Update note' : 'Add note'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '7px 12px',
                  backgroundColor: 'transparent',
                  color: theme.textMuted,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {error && <div style={{ color: theme.error, fontSize: 13 }}>{error}</div>}

        {/* search */}
        {notes.length > 2 && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            style={inputStyle}
          />
        )}

        {/* list */}
        {loading ? (
          <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 13 }}>
            {query ? 'No notes match your search.' : 'No notes yet. Add one above.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((note) => (
              <div
                key={note.id}
                style={{
                  backgroundColor: editingId === note.id ? `${theme.primary}0d` : theme.bgSecondary,
                  border: `1px solid ${editingId === note.id ? theme.primary : theme.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 2 }}>
                    {note.title}
                  </div>
                  {note.content && (
                    <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {note.content.length > MAX_PREVIEW_LENGTH
                        ? note.content.slice(0, MAX_PREVIEW_LENGTH) + '…'
                        : note.content}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                    {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleEdit(note)}
                    title="Edit"
                    style={{
                      padding: '5px 8px',
                      backgroundColor: 'transparent',
                      color: theme.textMuted,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 5,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    title="Delete"
                    style={{
                      padding: '5px 8px',
                      backgroundColor: 'transparent',
                      color: theme.error,
                      border: `1px solid ${theme.error}`,
                      borderRadius: 5,
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
