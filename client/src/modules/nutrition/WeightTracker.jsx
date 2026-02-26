import React, { useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import useWeight from './hooks/useWeight';

const KG_TO_LB = 2.2046226218;

function toDisplayWeight(weightKg, unit) {
  const kg = Number(weightKg);
  return unit === 'lb' ? kg * KG_TO_LB : kg;
}

function toKg(weightValue, unit) {
  const value = Number(weightValue);
  return unit === 'lb' ? value / KG_TO_LB : value;
}

function TrendGraph({ points, theme, unit, goalKg }) {
  const width = 520;
  const height = 220;
  const padding = 28;

  const chart = useMemo(() => {
    if (!points || points.length === 0) return { polyline: '', circles: [] };

    const weights = points.map((p) => toDisplayWeight(p.weightKg, unit));
    const goalDisplay = goalKg ? toDisplayWeight(goalKg, unit) : null;

    const minWeight = Math.min(...weights, ...(goalDisplay ? [goalDisplay] : []));
    const maxWeight = Math.max(...weights, ...(goalDisplay ? [goalDisplay] : []));
    const range = maxWeight - minWeight || 1;

    const circles = points.map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const displayWeight = toDisplayWeight(point.weightKg, unit);
      const y = height - padding - ((displayWeight - minWeight) / range) * (height - padding * 2);
      return { x, y, point };
    });

    const polyline = circles.map((c) => `${c.x},${c.y}`).join(' ');
    const goalY = goalDisplay === null
      ? null
      : height - padding - ((goalDisplay - minWeight) / range) * (height - padding * 2);

    return { polyline, circles, minWeight, maxWeight, goalY, goalDisplay };
  }, [points, unit, goalKg]);

  if (!points || points.length === 0) {
    return <div style={{ color: theme.textMuted, fontSize: 13 }}>No weight data for this range yet.</div>;
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke={theme.border} strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={theme.border} strokeWidth="1" />

        {chart.goalY !== null ? (
          <g>
            <line
              x1={padding}
              y1={chart.goalY}
              x2={width - padding}
              y2={chart.goalY}
              stroke={theme.error}
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text x={padding + 6} y={chart.goalY - 6} fill={theme.error} fontSize="11">
              Goal: {chart.goalDisplay.toFixed(1)} {unit}
            </text>
          </g>
        ) : null}

        <polyline fill="none" stroke={theme.primary} strokeWidth="2.5" points={chart.polyline} />

        {chart.circles.map((c) => (
          <g key={c.point.id}>
            <circle cx={c.x} cy={c.y} r="3.2" fill={theme.primaryDark} />
            <title>{`${c.point.entryDate}: ${toDisplayWeight(c.point.weightKg, unit).toFixed(1)} ${unit}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function WeightTracker() {
  const { theme, isDark } = useTheme();
  const { entries, trend, windowDays, loading, error, saveEntry, removeEntry, changeWindow } = useWeight();

  const [unit, setUnit] = useState('lb');
  const [weightKg, setWeightKg] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  const goalKg = goalWeight ? toKg(goalWeight, unit) : null;

  const minInput = unit === 'lb' ? '44' : '20';
  const maxInput = unit === 'lb' ? '882' : '400';

  async function onSubmit(e) {
    e.preventDefault();
    const value = Number(weightKg);
    if (!value || value <= 0) return;

    await saveEntry({ weightKg: toKg(value, unit), entryDate, note });
    setWeightKg('');
    setNote('');
  }

  return (
    <div style={{ marginTop: 0, padding: 24, backgroundColor: theme.bgSecondary, borderRadius: 8, border: `1px solid ${theme.border}` }}>
      <h3 style={{ margin: 0, marginBottom: 14, fontSize: 18, color: theme.text }}>Weight Tracker</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['kg', 'lb'].map((value) => (
          <button
            key={value}
            onClick={() => setUnit(value)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: `1px solid ${unit === value ? theme.primary : theme.border}`,
              backgroundColor: unit === value ? theme.bgTertiary : theme.bg,
              color: theme.text,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            {value}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '140px 160px 1fr auto', gap: 8, marginBottom: 16 }}>
        <input
          className="no-spin"
          type="number"
          step="0.1"
          min={minInput}
          max={maxInput}
          placeholder={`Weight (${unit})`}
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          required
          style={{ padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.bg, color: theme.text }}
        />
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          style={{ padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.bg, color: theme.text }}
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.bg, color: theme.text }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '8px 12px', border: 'none', borderRadius: 6, backgroundColor: loading ? theme.border : theme.primary, color: 'white', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          Save
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: theme.textSecondary }}>Goal</label>
        <input
          className="no-spin"
          type="number"
          step="0.1"
          min={minInput}
          max={maxInput}
          placeholder={`Optional (${unit})`}
          value={goalWeight}
          onChange={(e) => setGoalWeight(e.target.value)}
          style={{ width: 160, padding: '6px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.bg, color: theme.text }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[30, 90, 180].map((days) => (
          <button
            key={days}
            onClick={() => changeWindow(days)}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: `1px solid ${windowDays === days ? theme.primary : theme.border}`,
              backgroundColor: windowDays === days ? theme.bgTertiary : theme.bg,
              color: theme.text,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            {days}d
          </button>
        ))}
      </div>

      {error ? <div style={{ color: theme.error, marginBottom: 8, fontSize: 13 }}>{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: 16 }}>
        <div style={{ backgroundColor: isDark ? theme.bgTertiary : theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 10 }}>
          <TrendGraph points={trend.points} theme={theme} unit={unit} goalKg={goalKg} />
          <div style={{ marginTop: 8, display: 'flex', gap: 14, color: theme.textSecondary, fontSize: 12 }}>
            <span>
              Latest: {trend.stats.latestKg === null ? '—' : `${toDisplayWeight(trend.stats.latestKg, unit).toFixed(1)} ${unit}`}
            </span>
            <span>
              Change: {trend.stats.changeKg > 0 ? '+' : ''}{toDisplayWeight(trend.stats.changeKg, unit).toFixed(1)} {unit}
            </span>
            <span>Entries: {trend.stats.count}</span>
          </div>
        </div>

        <div style={{ minWidth: '100%' }}>
          <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>Recent Entries</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflow: 'auto' }}>
            {entries.slice(0, 12).map((entry) => (
              <div key={entry.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 6, padding: 8, backgroundColor: theme.bg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 13, color: theme.text }}>
                    <strong>{toDisplayWeight(entry.weightKg, unit).toFixed(1)} {unit}</strong> · {entry.entryDate}
                  </div>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    style={{ border: 'none', background: 'transparent', color: theme.error, cursor: 'pointer', fontSize: 12 }}
                  >
                    Delete
                  </button>
                </div>
                {entry.note ? <div style={{ marginTop: 4, fontSize: 12, color: theme.textSecondary }}>{entry.note}</div> : null}
              </div>
            ))}
            {entries.length === 0 ? <div style={{ fontSize: 12, color: theme.textMuted }}>No entries yet.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
