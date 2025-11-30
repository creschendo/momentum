import React from 'react';

// Presentational component: receives `status` from parent (no side-effects here)
export default function ModuleCard({ title, description, status }) {
  return (
    <div className="module-card">
      <h2>{title}</h2>
      <p className="muted">{description}</p>

      {(!status || status.loading) ? (
        <p>Checking status...</p>
      ) : status.ok ? (
        <div className="status ok">{status.data?.info || 'OK'}</div>
      ) : (
        <div className="status error">Error: {status.error || 'Unknown'}</div>
      )}
    </div>
  );
}
