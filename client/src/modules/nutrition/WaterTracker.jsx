import React, { useState } from 'react';
import useWater from './hooks/useWater';

export default function WaterTracker() {
  const { entries, summary, loading, error, addEntry, fetchAll, refreshSummary } = useWater();
  const [value, setValue] = useState(250);

  async function onAdd(e) {
    e.preventDefault();
    try {
      await addEntry({ volumeMl: Number(value) });
      setValue(250);
    } catch (err) {
      // error surfaced in hook
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <h3>Water Tracker</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <form onSubmit={onAdd}>
          <label>
            Volume (ml):{' '}
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} min={1} />
          </label>
          <button type="submit" style={{ marginLeft: 8 }}>Add</button>
        </form>
        <button onClick={() => fetchAll()}>Refresh</button>
      </div>

      {error && <div style={{ color: '#9b2c2c' }}>Error: {error}</div>}

      <div style={{ marginTop: 12 }}>
        <strong>Summary (daily):</strong>
        {loading ? <div>Loading...</div> : <div>{summary ? `${summary.totalMl} ml since ${new Date(summary.start).toLocaleString()}` : 'No data'}</div>}
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Entries:</strong>
        <ul>
          {entries.map((e) => (
            <li key={e.id}>{e.volumeMl} ml — {new Date(e.timestamp).toLocaleString()}</li>
          ))}
          {entries.length === 0 && <li>No entries yet</li>}
        </ul>
      </div>
    </div>
  );
}
