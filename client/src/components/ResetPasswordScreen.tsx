import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { resetPassword } from '../api/auth';

export default function ResetPasswordScreen() {
  const { theme, isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: theme.bg,
    color: theme.text,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div
        className="app-root"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', backgroundColor: theme.bg, color: theme.text, padding: 20
        }}
      >
        <div style={{
          width: '100%', maxWidth: 420,
          backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`,
          borderRadius: 12, padding: 24,
          boxShadow: `0 8px 24px rgba(0,0,0,${isDark ? '0.35' : '0.12'})`
        }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>Momentum</h1>
          <p style={{ margin: '0 0 16px', color: theme.error, fontSize: 14 }}>
            Invalid or missing reset link.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: 13, padding: 0 }}
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-root"
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: theme.bg, color: theme.text, padding: 20
      }}
    >
      <div style={{
        width: '100%', maxWidth: 420,
        backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`,
        borderRadius: 12, padding: 24,
        boxShadow: `0 8px 24px rgba(0,0,0,${isDark ? '0.35' : '0.12'})`
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>Momentum</h1>

        {done ? (
          <div>
            <div style={{
              padding: '12px 14px', marginBottom: 16,
              backgroundColor: theme.primaryLight, border: `1px solid ${theme.primary}`,
              borderRadius: 8, fontSize: 13, color: theme.text, lineHeight: 1.5
            }}>
              Password updated. You can now log in with your new password.
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{ background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: 13, padding: 0 }}
            >
              Go to login →
            </button>
          </div>
        ) : (
          <>
            <p style={{ margin: '0 0 20px', color: theme.textMuted, fontSize: 14 }}>
              Choose a new password for your account.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                required
                minLength={8}
                style={inputStyle}
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={8}
                style={inputStyle}
              />

              {error && <div style={{ color: theme.error, fontSize: 13 }}>{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 4, padding: '10px 12px',
                  border: 'none', borderRadius: 8,
                  backgroundColor: submitting ? theme.border : theme.primary,
                  color: 'white', fontSize: 14, fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Updating...' : 'Set new password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
