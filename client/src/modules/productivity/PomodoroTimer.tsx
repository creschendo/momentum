import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

type TimerMode = 'work' | 'break';

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function PomodoroTimer() {
  const { theme } = useTheme();
  const ringColor = '#3ecf8e';
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [workInput, setWorkInput] = useState('25');
  const [breakInput, setBreakInput] = useState('5');
  const [mode, setMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(workMinutes * 60);

  const totalSeconds = useMemo(
    () => (mode === 'work' ? workMinutes : breakMinutes) * 60,
    [mode, workMinutes, breakMinutes]
  );

  const ringRadius = 64;
  const ringStroke = 8;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const remainingProgress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const clampedRemainingProgress = Math.max(0, Math.min(1, remainingProgress));
  const ringDashOffset = ringCircumference * (1 - clampedRemainingProgress);

  useEffect(() => {
    if (!isRunning) {
      setRemainingSeconds(totalSeconds);
    }
  }, [isRunning, totalSeconds]);

  useEffect(() => {
    if (!isRunning) return undefined;

    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          const nextMode = mode === 'work' ? 'break' : 'work';
          setMode(nextMode);
          setIsRunning(false);
          return (nextMode === 'work' ? workMinutes : breakMinutes) * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, mode, workMinutes, breakMinutes]);

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const clampMinutes = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

  const commitWorkInput = () => {
    if (workInput.trim() === '') {
      setWorkInput(String(workMinutes));
      return;
    }
    const parsed = Number(workInput);
    if (!Number.isFinite(parsed)) {
      setWorkInput(String(workMinutes));
      return;
    }
    const clamped = clampMinutes(parsed, 1, 120);
    setWorkMinutes(clamped);
    setWorkInput(String(clamped));
  };

  const commitBreakInput = () => {
    if (breakInput.trim() === '') {
      setBreakInput(String(breakMinutes));
      return;
    }
    const parsed = Number(breakInput);
    if (!Number.isFinite(parsed)) {
      setBreakInput(String(breakMinutes));
      return;
    }
    const clamped = clampMinutes(parsed, 1, 60);
    setBreakMinutes(clamped);
    setBreakInput(String(clamped));
  };

  return (
    <div style={{ marginTop: 24, padding: '24px', backgroundColor: theme.bgSecondary, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.text }}>Pomodoro Timer</h3>
        <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
          {mode === 'work' ? 'Focus' : 'Break'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 170,
          height: 170,
          marginLeft: 'clamp(12px, 4vw, 64px)',
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          backgroundColor: theme.bg,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 8px 24px ${theme.bg}AA, inset 0 0 0 1px ${theme.border}`
        }}>
          <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="85"
              cy="85"
              r={ringRadius}
              fill="none"
              stroke={theme.border}
              strokeWidth={ringStroke}
              opacity={0.7}
            />
            <g transform="translate(170 0) scale(-1 1)">
              <circle
                cx="85"
                cy="85"
                r={ringRadius}
                fill="none"
                stroke={ringColor}
                strokeWidth={ringStroke}
                strokeLinecap={clampedRemainingProgress > 0 ? 'round' : 'butt'}
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringDashOffset}
                style={{
                  transition: 'stroke-dashoffset 0.35s linear',
                  filter: `drop-shadow(0 0 8px ${ringColor}99)`
                }}
              />
            </g>
          </svg>
          <div style={{
            position: 'absolute',
            fontSize: 32,
            fontWeight: 700,
            color: theme.text,
            padding: '4px 8px',
            minWidth: 108,
            textAlign: 'center'
          }}>
            {formatTime(remainingSeconds)}
            <div style={{
              marginTop: 3,
              fontSize: 10,
              letterSpacing: 1,
              fontWeight: 600,
              textTransform: 'uppercase',
              color: theme.textMuted
            }}>
              {mode}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsRunning((s) => !s)}
            style={{
              padding: '10px 16px',
              backgroundColor: theme.primary,
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '10px 16px',
              backgroundColor: theme.bgTertiary,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>
            Focus minutes
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={workInput}
            onChange={(e) => {
              const next = e.target.value;
              if (!/^\d*$/.test(next)) return;
              setWorkInput(next);
              if (next === '') return;
              const parsed = Number(next);
              if (parsed >= 1 && parsed <= 120) {
                setWorkMinutes(parsed);
              }
            }}
            onBlur={commitWorkInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitWorkInput();
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              backgroundColor: theme.bg,
              color: theme.text
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>
            Break minutes
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={breakInput}
            onChange={(e) => {
              const next = e.target.value;
              if (!/^\d*$/.test(next)) return;
              setBreakInput(next);
              if (next === '') return;
              const parsed = Number(next);
              if (parsed >= 1 && parsed <= 60) {
                setBreakMinutes(parsed);
              }
            }}
            onBlur={commitBreakInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitBreakInput();
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              fontSize: 14,
              fontFamily: 'inherit',
              backgroundColor: theme.bg,
              color: theme.text
            }}
          />
        </div>
      </div>
    </div>
  );
}
