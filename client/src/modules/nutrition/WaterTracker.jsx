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

  const waterHeight = 110 * progress;
  const waterTop = Math.max(40, 155 - waterHeight);

  // Logs water intake and briefly spawns a droplet animation.
  async function onAdd(e) {
    e.preventDefault();
    try {
      await addEntry({ volumeMl: Number(value) });
      
      // Create droplet animation
      const dropletId = dropletIdRef.current++;
      const randomX = Math.random() * 0; // keep drops near center
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
            transform: translateY(0) translateX(0) scale(1);
          }
          70% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translateY(118px) translateX(var(--offset-x)) scale(0.7);
          }
        }
        @keyframes waterWaveDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-24px); }
        }
        @keyframes bubbleRise {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.6);
          }
          20% {
            opacity: 0.65;
          }
          100% {
            opacity: 0;
            transform: translateY(-34px) scale(1);
          }
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
        {/* Water Graphic */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: 150 }}>
          <svg width={140} height={172} viewBox="0 0 140 172" aria-label="Water level visualization" style={{ position: 'relative', zIndex: 1 }}>
            <defs>
              <clipPath id="tankClip">
                <rect x="28" y="32" width="84" height="124" rx="14" ry="14" />
              </clipPath>
              <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.primary} stopOpacity="0.92" />
                <stop offset="100%" stopColor={theme.primaryDark} stopOpacity="0.98" />
              </linearGradient>
              <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
              </linearGradient>
            </defs>

            <ellipse cx="70" cy="160" rx="42" ry="8" fill={theme.borderLight} opacity="0.24" />

            <rect x="28" y="32" width="84" height="124" rx="14" ry="14" fill={theme.bg} stroke={theme.border} strokeWidth="2" />

            <rect
              x="28"
              y={waterTop}
              width="84"
              height={waterHeight}
              fill="url(#waterGradient)"
              opacity="0.94"
              clipPath="url(#tankClip)"
              style={{ transition: 'y 400ms ease, height 400ms ease' }}
            />

            <g clipPath="url(#tankClip)" style={{ opacity: 0.8 }}>
              <path
                d={`M 20 ${waterTop + 4} C 35 ${waterTop - 3}, 53 ${waterTop + 8}, 70 ${waterTop + 3} C 89 ${waterTop - 2}, 108 ${waterTop + 8}, 130 ${waterTop + 2}`}
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="2"
                fill="none"
                style={{ animation: 'waterWaveDrift 1800ms linear infinite' }}
              />
              <path
                d={`M 24 ${waterTop + 10} C 40 ${waterTop + 4}, 58 ${waterTop + 14}, 76 ${waterTop + 9} C 93 ${waterTop + 4}, 108 ${waterTop + 14}, 132 ${waterTop + 8}`}
                stroke="rgba(255,255,255,0.38)"
                strokeWidth="1.4"
                fill="none"
                style={{ animation: 'waterWaveDrift 2600ms linear infinite reverse' }}
              />

              {[0, 1, 2].map((idx) => (
                <circle
                  key={`bubble-${idx}`}
                  cx={56 + idx * 14}
                  cy={Math.max(waterTop + 20, 66 + idx * 4)}
                  r={2 + (idx % 2)}
                  fill="rgba(255,255,255,0.55)"
                  style={{
                    animation: `bubbleRise ${2200 + idx * 400}ms ease-in-out infinite`,
                    animationDelay: `${idx * 260}ms`
                  }}
                />
              ))}
            </g>

            <rect x="36" y="40" width="16" height="106" rx="8" ry="8" fill="url(#glassShine)" opacity="0.7" />

            <rect x="28" y="32" width="84" height="124" rx="14" ry="14" fill="none" stroke={theme.textSecondary} strokeOpacity="0.35" strokeWidth="1" />

            {animatingDroplets.map((droplet) => (
              <path
                key={droplet.id}
                d="M -4 -4 C -2 -8, 2 -8, 4 -4 C 4 -1, 2 2, 0 4 C -2 2, -4 -1, -4 -4 Z"
                fill={theme.primary}
                style={{
                  transform: `translate(${70 + droplet.offsetX}px, 30px)`,
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
