import React, { useEffect, useState } from 'react';
import SettingsLayout from '../components/SettingsLayout';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';

export default function ProfilePage() {
  const { theme } = useTheme();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({ displayName: '', dateOfBirth: '', sex: '', heightCm: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    authApi.getProfile()
      .then((profile) => {
        setForm({
          displayName: profile.displayName || '',
          dateOfBirth: profile.dateOfBirth || '',
          sex: profile.sex || '',
          heightCm: profile.heightCm ? String(profile.heightCm) : ''
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await authApi.updateProfile({
        displayName: form.displayName || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        sex: form.sex || undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined
      });
      await refreshUser();
      setSuccess('Profile saved.');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const input: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: `1px solid ${theme.border}`,
    borderRadius: 6,
    backgroundColor: theme.bg,
    color: theme.text,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  };

  const label: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 4
  };

  return (
    <SettingsLayout current="profile">
      <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 16 }}>Profile</div>

        {loading ? (
          <div style={{ color: theme.textMuted, fontSize: 13 }}>Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={label}>Display name</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Your name"
                style={input}
              />
            </div>

            <div>
              <label style={label}>Date of birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                style={input}
              />
            </div>

            <div>
              <label style={label}>Sex</label>
              <select
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
                style={input}
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label style={label}>Height (cm)</label>
              <input
                type="number"
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                placeholder="e.g. 175"
                min={50}
                max={300}
                style={input}
              />
            </div>

            {error && <div style={{ color: theme.error, fontSize: 13 }}>{error}</div>}
            {success && <div style={{ color: theme.primary, fontSize: 13 }}>{success}</div>}

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 16px',
                backgroundColor: theme.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 7,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.7 : 1,
                fontFamily: 'inherit'
              }}
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        )}
      </div>
    </SettingsLayout>
  );
}
