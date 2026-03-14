import React, { useEffect, useState } from 'react';
import SettingsLayout from '../components/SettingsLayout';
import { useTheme } from '../context/ThemeContext';
import * as authApi from '../api/auth';

function parseDevice(userAgent: string): string {
  if (!userAgent) return 'Unknown device';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS device';
  if (/Android/i.test(userAgent)) return 'Android device';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Unknown device';
}

function parseBrowser(userAgent: string): string {
  if (!userAgent) return '';
  if (/Edg\//i.test(userAgent)) return 'Edge';
  if (/Chrome/i.test(userAgent)) return 'Chrome';
  if (/Firefox/i.test(userAgent)) return 'Firefox';
  if (/Safari/i.test(userAgent)) return 'Safari';
  return 'Browser';
}

export default function SecurityPage() {
  const { theme } = useTheme();
  const [sessions, setSessions] = useState<authApi.SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await authApi.getSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (id: number) => {
    setRevoking(id);
    try {
      await authApi.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <SettingsLayout current="security">
      <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 4 }}>Active sessions</div>
        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 16 }}>
          These devices currently have access to your account. Revoke any you don't recognise.
        </div>

        {error && <div style={{ color: theme.error, fontSize: 13, marginBottom: 10 }}>{error}</div>}

        {loading ? (
          <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading…</div>
        ) : sessions.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 13 }}>No active sessions.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  border: `1px solid ${session.isCurrent ? theme.primary : theme.border}`,
                  borderRadius: 8,
                  backgroundColor: session.isCurrent ? `${theme.primary}0d` : theme.bg
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {parseDevice(session.userAgent)} · {parseBrowser(session.userAgent)}
                    {session.isCurrent && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: theme.primary, backgroundColor: `${theme.primary}22`, padding: '1px 6px', borderRadius: 4 }}>
                        current
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                    {session.ipAddress || 'Unknown IP'} · Signed in {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    type="button"
                    disabled={revoking === session.id}
                    onClick={() => handleRevoke(session.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: 'transparent',
                      color: theme.error,
                      border: `1px solid ${theme.error}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: revoking === session.id ? 'default' : 'pointer',
                      opacity: revoking === session.id ? 0.5 : 1,
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {revoking === session.id ? 'Revoking…' : 'Revoke'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
