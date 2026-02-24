import React from 'react';

// Presentational component: receives `status` from parent (no side-effects here)
export default function ModuleCard({ title, description, status }) {
  const getStatusDot = () => {
    return '#48bb78'; // green
  };

  return (
    <div className="module-title-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getStatusDot(),
            display: 'inline-block',
            transition: 'background-color 200ms'
          }}
        />
        <h2 style={{ margin: 0 }}>{title}</h2>
      </div>
      <p className="muted">{description}</p>
    </div>
  );
}
