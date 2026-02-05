import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function PomodoroTimer() {
  const { theme } = useTheme();
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState('work');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(workMinutes * 60);

  const totalSeconds = useMemo(
    () => (mode === 'work' ? workMinutes : breakMinutes) * 60,
    [mode, workMinutes, breakMinutes]
  );

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
          fontSize: 36,
          fontWeight: 700,
          color: theme.text,
          padding: '12px 16px',
          borderRadius: 8,
          backgroundColor: theme.bg,
          border: `1px solid ${theme.border}`
        }}>
          {formatTime(remainingSeconds)}
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
            type="number"
            min={1}
            max={120}
            value={workMinutes}
            onChange={(e) => setWorkMinutes(Number(e.target.value))}
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
            type="number"
            min={1}
            max={60}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
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
