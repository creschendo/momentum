import React, { useEffect, useState } from 'react';

export default function ModuleCard({ moduleKey, title, description }) {
  const [status, setStatus] = useState({ loading: true });

  useEffect(() => {
    let mounted = true;
    fetch(`/api/${moduleKey}/status`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setStatus({ loading: false, ok: true, data });
      })
      .catch((err) => {
        if (mounted) setStatus({ loading: false, ok: false, error: err.message });
      });
    return () => {
      mounted = false;
    };
  }, [moduleKey]);

  return (
    <div className="module-card">
      <h2>{title}</h2>
      <p className="muted">{description}</p>

      {status.loading ? (
        <p>Checking status...</p>
      ) : status.ok ? (
        <div className="status ok">{status.data.info || 'OK'}</div>
      ) : (
        <div className="status error">Error: {status.error || 'Unknown'}</div>
      )}
    </div>
  );
}
