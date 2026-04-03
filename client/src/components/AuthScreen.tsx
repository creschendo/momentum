import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { forgotPassword } from '../api/auth';

type Mode = 'login' | 'register' | 'forgot';

export default function AuthScreen() {
  const { theme, isDark } = useTheme();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setForgotSent(false);
  }

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
    setSubmitting(true);

    try {
      if (isForgot) {
        await forgotPassword(email);
        setForgotSent(true);
      } else if (isRegister) {
        localStorage.setItem('momentum-onboarding-pending', 'true');
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      if (isRegister) localStorage.removeItem('momentum-onboarding-pending');
      setError(err?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

  const subtitle = isForgot
    ? 'Enter your email and we\'ll send a reset link'
    : isRegister
      ? 'Create your account to continue'
      : 'Sign in to continue';

  return (
    <div
      className="app-root"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
        color: theme.text,
        padding: 20
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 24,
          boxShadow: `0 8px 24px rgba(0, 0, 0, ${isDark ? '0.35' : '0.12'})`
        }}
      >
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 24 }}>Momentum</h1>
        <p style={{ margin: 0, marginBottom: 20, color: theme.textMuted, fontSize: 14 }}>
          {subtitle}
        </p>

        {/* ── Forgot password — success state ── */}
        {isForgot && forgotSent ? (
          <div>
            <div style={{
              padding: '12px 14px',
              backgroundColor: theme.primaryLight,
              border: `1px solid ${theme.primary}`,
              borderRadius: 8,
              fontSize: 13,
              color: theme.text,
              lineHeight: 1.5,
              marginBottom: 16
            }}>
              Check your inbox — if that email is registered, a reset link is on its way.
            </div>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{ background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: 13, padding: 0 }}
            >
              ← Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isRegister && (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                style={inputStyle}
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={inputStyle}
            />

            {!isForgot && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={8}
                style={inputStyle}
              />
            )}

            {/* Forgot password link — only on login */}
            {!isRegister && !isForgot && (
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: 12, padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && <div style={{ color: theme.error, fontSize: 13 }}>{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 4,
                padding: '10px 12px',
                border: 'none',
                borderRadius: 8,
                backgroundColor: submitting ? theme.border : theme.primary,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting
                ? 'Please wait...'
                : isForgot
                  ? 'Send reset link'
                  : isRegister
                    ? 'Create Account'
                    : 'Login'}
            </button>
          </form>
        )}

        {/* ── Mode switcher ── */}
        {!forgotSent && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {isForgot ? (
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{ background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: 13, padding: 0, textAlign: 'left' }}
              >
                ← Back to login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode(isRegister ? 'login' : 'register')}
                style={{ background: 'transparent', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: 13, padding: 0, textAlign: 'left' }}
              >
                {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
