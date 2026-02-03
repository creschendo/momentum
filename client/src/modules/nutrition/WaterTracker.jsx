import React, { useMemo, useState, useRef } from 'react';
import useWater from './hooks/useWater';
import { useTheme } from '../../context/ThemeContext';

export default function WaterTracker() {
  const { theme } = useTheme();
  const { entries, summary, loading, error, addEntry, fetchAll, refreshSummary } = useWater();
  const [value, setValue] = useState(250);
  const [goalMl, setGoalMl] = useState(2000);
  const [animatingDroplets, setAnimatingDroplets] = useState([]);
  const dropletIdRef = useRef(0);

  const totalMl = summary?.totalMl || 0;
  const progress = useMemo(() => {
    if (!goalMl || Number(goalMl) <= 0) return 0;
    return Math.min(totalMl / Number(goalMl), 1);
  }, [goalMl, totalMl]);

  const ring = useMemo(() => {
    const size = 120;
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);
    return { size, stroke, radius, circumference, offset };
  }, [progress]);

  async function onAdd(e) {
    e.preventDefault();
    try {
      await addEntry({ volumeMl: Number(value) });
      
      // Create droplet animation
      const dropletId = dropletIdRef.current++;
      const randomX = Math.random() * 40 - 20; // -20 to 20
      setAnimatingDroplets((prev) => [...prev, { id: dropletId, offsetX: randomX }]);
      
      // Remove droplet after animation completes
      setTimeout(() => {
        setAnimatingDroplets((prev) => prev.filter((d) => d.id !== dropletId));
      }, 1200);
      
      setValue(250);
    } catch (err) {
      // error surfaced in hook
    }
  }

  return (
    <div style={{ marginTop: 24, padding: '24px', backgroundColor: theme.bgSecondary, borderRadius: 8 }}>
      <style>{`
        @keyframes dropletFall {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateY(120px) translateX(var(--offset-x));
          }
        }
        @keyframes dropletSplash {
          0% { transform: scale(1); }
          50% { transform: scale(0.8); }
          100% { transform: scale(0.6); }
        }
      `}</style>
      <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 600, color: theme.text }}>Water Intake</h3>
      <form onSubmit={onAdd} style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#4a5568', marginBottom: 6 }}>
            Add (ml)
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min={1}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit'
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: '8px 20px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 200ms'
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#2563a8')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#3182ce')}
        >
          Log Water
        </button>
      </form>

      <div style={{ marginTop: 12, display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Water Bucket */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: 150 }}>
          <svg width={120} height={150} viewBox="0 0 120 150" aria-label="Water bucket" style={{ position: 'relative', zIndex: 1 }}>
            {/* Bucket outline */}
            <path
              d="M 25 40 L 20 150 Q 20 155 25 155 L 95 155 Q 100 155 100 150 L 95 40 Z"
              stroke="#1a202c"
              strokeWidth="2"
              fill="none"
            />
            {/* Bucket handle */}
            <path
              d="M 30 40 Q 30 20 60 15 Q 90 20 90 40"
              stroke="#1a202c"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Water fill */}
            <defs>
              <clipPath id="bucketClip">
                <path d="M 25 40 L 20 150 Q 20 155 25 155 L 95 155 Q 100 155 100 150 L 95 40 Z" />
              </clipPath>
            </defs>
            <rect
              x="20"
              y={Math.max(40, 155 - (110 * progress))}
              width="80"
              height={110 * progress}
              fill="#3182ce"
              opacity="0.7"
              clipPath="url(#bucketClip)"
              style={{ transition: 'y 300ms ease' }}
            />
            
            {/* Water wave effect */}
            <path
              d={`M 25 ${155 - 110 * progress} Q 40 ${155 - 110 * progress - 3} 60 ${155 - 110 * progress} T 95 ${155 - 110 * progress}`}
              stroke="#3182ce"
              strokeWidth="1"
              fill="none"
              opacity="0.5"
            />

            {/* Animated droplets falling */}
            {animatingDroplets.map((droplet) => (
              <circle
                key={droplet.id}
                cx={60 + droplet.offsetX}
                cy="30"
                r="4"
                fill="#3182ce"
                opacity="0.8"
                style={{
                  animation: `dropletFall 1.2s ease-in forwards`,
                  '--offset-x': `${droplet.offsetX}px`,
                }}
              />
            ))}
          </svg>
          <div style={{ fontSize: 13, color: '#718096', marginTop: 10, fontWeight: 500, textAlign: 'center' }}>
            {totalMl} / {goalMl} ml
          </div>
          <div style={{ fontSize: 12, color: '#cbd5e0', marginTop: 4 }}>
            {Math.round(progress * 100)}%
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Goal</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min={250}
                step={50}
                value={goalMl}
                onChange={(e) => setGoalMl(Number(e.target.value))}
                style={{
                  width: 110,
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit'
                }}
              />
              <span style={{ fontSize: 14, color: '#4a5568', fontWeight: 500 }}>ml</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</div>
            {loading ? (
              <div style={{ fontSize: 14, color: '#718096' }}>Loading...</div>
            ) : (
              <div style={{ fontSize: 14, color: '#2d3748', fontWeight: 500 }}>
                {summary ? new Date(summary.start).toLocaleDateString() : 'No data'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
