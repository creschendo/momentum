import React, { useEffect, useMemo, useState } from 'react';
import ModuleContainer from '../../components/ModuleContainer';
import { useTheme } from '../../context/ThemeContext';
import {
  createSleepSession,
  deleteSleepSession,
  getSleepSessions,
  getSleepSummary
} from '../../api/sleep';

function toDatetimeLocalInputValue(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getDefaultSleepWindow() {
  const end = new Date();
  end.setHours(7, 30, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  start.setHours(23, 0, 0, 0);

  return {
    startTime: toDatetimeLocalInputValue(start),
    endTime: toDatetimeLocalInputValue(end)
  };
}

export default function SleepModule() {
  const { theme } = useTheme();
  const defaults = useMemo(() => getDefaultSleepWindow(), []);
  const [startTime, setStartTime] = useState(defaults.startTime);
  const [endTime, setEndTime] = useState(defaults.endTime);
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({ avgDurationHours: 0, avgQuality: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const [sessionData, summaryData] = await Promise.all([
        getSleepSessions({ limit: 20 }),
        getSleepSummary({ days: 7 })
      ]);
      setSessions(Array.isArray(sessionData) ? sessionData : []);
      setSummary(summaryData || { avgDurationHours: 0, avgQuality: 0, count: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load sleep data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await createSleepSession({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        quality,
        notes
      });
      setNotes('');
      await loadData({ silent: true });
    } catch (err) {
      setError(err.message || 'Failed to save sleep session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSleepSession(id);
      await loadData({ silent: true });
    } catch (err) {
      setError(err.message || 'Failed to delete sleep session');
    }
  };

  return (
    <div>
      <ModuleContainer
        moduleKey="sleep"
        title="Sleep"
        description="Log sleep sessions and monitor nightly recovery."
      />

      <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10
          }}
        >
          <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 12, color: theme.textMuted }}>7-day avg sleep</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.text }}>{summary.avgDurationHours || 0}h</div>
          </div>
          <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 12, color: theme.textMuted }}>7-day avg quality</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.text }}>{summary.avgQuality || 0}/5</div>
          </div>
          <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 12, color: theme.textMuted }}>Entries (7 days)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: theme.text }}>{summary.count || 0}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 8 }}>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.bg, color: theme.text }}
              required
            />
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.bg, color: theme.text }}
              required
            />
            <select
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              style={{ padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.bg, color: theme.text }}
            >
              <option value={1}>1 - Poor</option>
              <option value={2}>2 - Fair</option>
              <option value={3}>3 - Good</option>
              <option value={4}>4 - Great</option>
              <option value={5}>5 - Excellent</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              style={{ flex: 1, padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.bg, color: theme.text }}
            />
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: 6,
                backgroundColor: theme.primary,
                color: 'white',
                cursor: 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? 'Saving...' : 'Log Sleep'}
            </button>
          </div>
        </form>

        {error && <div style={{ color: theme.error, fontSize: 13 }}>{error}</div>}

        <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 8 }}>Recent Sessions</div>
          {loading ? (
            <div style={{ color: theme.textMuted }}>Loading sleep sessions...</div>
          ) : sessions.length === 0 ? (
            <div style={{ color: theme.textMuted }}>No sleep sessions yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: 6,
                    padding: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>
                      {new Date(session.startTime).toLocaleString()} → {new Date(session.endTime).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>
                      {session.durationHours}h • Quality {session.quality}/5 {session.notes ? `• ${session.notes}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(session.id)}
                    style={{
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 8px',
                      backgroundColor: theme.error,
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    aria-label="Delete sleep session"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
