import React, { useMemo, useState, useRef } from 'react';
import useWater from './hooks/useWater';
import { useTheme } from '../../context/ThemeContext';

export default function WaterTracker() {
  const { theme, isDark } = useTheme();
  // Hook manages water entries, totals, and reset actions.
  const { entries, summary, loading, error, addEntry, fetchAll, refreshSummary, resetEntries } = useWater();
  const [value, setValue] = useState(250);
  const [goalMl, setGoalMl] = useState(2000);
  const [animatingDroplets, setAnimatingDroplets] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const dropletIdRef = useRef(0);

  const totalMl = summary?.totalMl || 0;
  const progress = useMemo(() => {
    if (!goalMl || Number(goalMl) <= 0) return 0;
    return Math.min(totalMl / Number(goalMl), 1);
  }, [goalMl, totalMl]);

  // Precompute circular progress geometry for the hydration ring.
  const ring = useMemo(() => {
    const size = 120;
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);
    return { size, stroke, radius, circumference, offset };
  }, [progress]);

  // Logs water intake and briefly spawns a droplet animation.
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

  async function handleReset() {
    try {
      await resetEntries();
      setShowResetConfirm(false);
    } catch (err) {
      // error surfaced in hook
    }
  }

  return (
    <div style={{
      marginTop: 0,
      padding: '24px',
      backgroundColor: theme.bgSecondary,
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      boxShadow: `0 6px 18px rgba(0,0,0,${theme.bg === '#0f1419' ? '0.25' : '0.08'})`
    }}>
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
      <form onSubmit={onAdd} style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: isDark ? theme.textMuted : '#4a5568', marginBottom: 6 }}>
            Add (ml)
          </label>
          <input
            type="number"
            className="no-spin"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min={1}
            style={{
              width: '50%',
              maxWidth: 280,
              minWidth: 140,
              padding: '8px 12px',
              border: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0',
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              backgroundColor: isDark ? theme.bgTertiary : 'white',
              color: isDark ? theme.text : '#1a202c'
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            flexShrink: 0,
            padding: '8px 20px',
            backgroundColor: theme.primary,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 200ms'
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = theme.primaryDark)}
          onMouseLeave={(e) => (e.target.style.backgroundColor = theme.primary)}
        >
          Log Water
        </button>
      </form>

      <div style={{ marginTop: 12, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Water Bucket */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: 150 }}>
          <svg width={120} height={150} viewBox="0 0 120 150" aria-label="Water bucket" style={{ position: 'relative', zIndex: 1 }}>
            <defs>
              <clipPath id="bucketClip">
                <path d="M 25 40 L 20 150 Q 20 155 25 155 L 95 155 Q 100 155 100 150 L 95 40 Z" />
              </clipPath>
              <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.primary} stopOpacity="0.85" />
                <stop offset="100%" stopColor={theme.primaryDark} stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Soft shadow */}
            <ellipse cx="60" cy="150" rx="34" ry="6" fill={theme.borderLight} opacity="0.25" />

            {/* Bucket outline */}
            <path
              d="M 25 40 L 20 150 Q 20 155 25 155 L 95 155 Q 100 155 100 150 L 95 40 Z"
              stroke={theme.textSecondary}
              strokeWidth="2"
              fill="none"
            />
            {/* Bucket handle */}
            <path
              d="M 30 40 Q 30 20 60 15 Q 90 20 90 40"
              stroke={theme.textSecondary}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Water fill */}
            <rect
              x="20"
              y={Math.max(40, 155 - (110 * progress))}
              width="80"
              height={110 * progress}
              fill="url(#waterGradient)"
              opacity="0.9"
              clipPath="url(#bucketClip)"
              style={{ transition: 'y 300ms ease' }}
            />
            
            {/* Water wave effect */}
            <path
              d={`M 25 ${155 - 110 * progress} Q 40 ${155 - 110 * progress - 3} 60 ${155 - 110 * progress} T 95 ${155 - 110 * progress}`}
              stroke={theme.primary}
              strokeWidth="1.2"
              fill="none"
              opacity="0.7"
            />

            {/* Animated droplets falling */}
            {animatingDroplets.map((droplet) => (
              <circle
                key={droplet.id}
                cx={60 + droplet.offsetX}
                cy="30"
                r="4"
                fill={theme.primary}
                opacity="0.9"
                style={{
                  animation: `dropletFall 1.2s ease-in forwards`,
                  '--offset-x': `${droplet.offsetX}px`,
                }}
              />
            ))}
          </svg>
          <div style={{ fontSize: 13, color: theme.textSecondary, marginTop: 10, fontWeight: 500, textAlign: 'center' }}>
            {totalMl} / {goalMl} ml
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
            {Math.round(progress * 100)}%
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#718096', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Goal</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min={250}
                className="no-spin"
                step={50}
                value={goalMl}
                onChange={(e) => setGoalMl(Number(e.target.value))}
                style={{
                  width: 110,
                  padding: '8px 12px',
                  border: isDark ? `1px solid ${theme.border}` : '1px solid #cbd5e0',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  backgroundColor: isDark ? theme.bgTertiary : 'white',
                  color: isDark ? theme.text : '#1a202c'
                }}
              />
              <span style={{ fontSize: 14, color: isDark ? theme.textSecondary : '#4a5568', fontWeight: 500 }}>ml</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: isDark ? theme.textMuted : '#718096', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</div>
            {loading ? (
              <div style={{ fontSize: 14, color: isDark ? theme.textMuted : '#718096' }}>Loading...</div>
            ) : (
              <div style={{ fontSize: 14, color: isDark ? theme.text : '#2d3748', fontWeight: 500 }}>
                {summary ? new Date(summary.start).toLocaleDateString() : 'No data'}
              </div>
            )}
          </div>
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: theme.errorBg,
                color: theme.error,
                border: `1px solid ${theme.error}`,
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms'
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
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: theme.bg,
            padding: 24,
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            maxWidth: 400,
            width: '90%'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: theme.text }}>
              Reset Water Intake?
            </h4>
            <p style={{ margin: '0 0 20px 0', fontSize: 14, color: theme.textSecondary }}>
              This will permanently delete all your water intake entries. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: theme.bgTertiary,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.primaryLight;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = theme.bgTertiary;
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: theme.error,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 200ms'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.opacity = '1';
                }}
              >
                {loading ? 'Resetting...' : 'Reset All Entries'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
