import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { theme, isDark } = useTheme();
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

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
          {isRegister ? 'Create your account to continue' : 'Sign in to continue'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isRegister && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              style={{
                padding: '10px 12px',
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: theme.bg,
                color: theme.text
              }}
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{
              padding: '10px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              fontSize: 14,
              backgroundColor: theme.bg,
              color: theme.text
            }}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={8}
            style={{
              padding: '10px 12px',
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              fontSize: 14,
              backgroundColor: theme.bg,
              color: theme.text
            }}
          />

          {error ? <div style={{ color: theme.error, fontSize: 13 }}>{error}</div> : null}

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
            {submitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(isRegister ? 'login' : 'register');
            setError('');
          }}
          style={{
            marginTop: 14,
            background: 'transparent',
            border: 'none',
            color: theme.primary,
            cursor: 'pointer',
            fontSize: 13,
            padding: 0
          }}
        >
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
}
