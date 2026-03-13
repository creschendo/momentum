import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsLayout from '../components/SettingsLayout';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';

function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) {
  return (
    <div style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20, marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}

export default function AccountPage() {
  const { theme } = useTheme();
  const { refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [emailForm, setEmailForm] = useState({ email: '', password: '' });
  const [emailState, setEmailState] = useState({ saving: false, error: '', success: '' });

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwState, setPwState] = useState({ saving: false, error: '', success: '' });

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteState, setDeleteState] = useState({ saving: false, error: '' });

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

  const label: React.CSSProperties = { display: 'block', fontSize: 12, color: theme.textMuted, marginBottom: 4 };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailState({ saving: true, error: '', success: '' });
    try {
      await authApi.updateEmail(emailForm.email, emailForm.password);
      await refreshUser();
      setEmailForm({ email: '', password: '' });
      setEmailState({ saving: false, error: '', success: 'Email updated.' });
    } catch (err: any) {
      setEmailState({ saving: false, error: err.message || 'Failed to update email', success: '' });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwState({ saving: false, error: 'Passwords do not match', success: '' });
      return;
    }
    setPwState({ saving: true, error: '', success: '' });
    try {
      await authApi.updatePassword(pwForm.current, pwForm.next);
      setPwForm({ current: '', next: '', confirm: '' });
      setPwState({ saving: false, error: '', success: 'Password updated.' });
    } catch (err: any) {
      setPwState({ saving: false, error: err.message || 'Failed to update password', success: '' });
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteState({ saving: true, error: '' });
    try {
      await authApi.deleteAccount(deletePassword);
      await logout();
      navigate('/');
    } catch (err: any) {
      setDeleteState({ saving: false, error: err.message || 'Failed to delete account' });
    }
  };

  return (
    <SettingsLayout current="account">
      <Section title="Change email" theme={theme}>
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={label}>New email</label>
            <input type="email" value={emailForm.email} onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })} required style={input} />
          </div>
          <div>
            <label style={label}>Current password</label>
            <input type="password" value={emailForm.password} onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })} required style={input} />
          </div>
          {emailState.error && <div style={{ color: theme.error, fontSize: 13 }}>{emailState.error}</div>}
          {emailState.success && <div style={{ color: theme.primary, fontSize: 13 }}>{emailState.success}</div>}
          <button type="submit" disabled={emailState.saving} style={{ padding: '8px 14px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: emailState.saving ? 0.7 : 1, fontFamily: 'inherit', alignSelf: 'flex-start' }}>
            {emailState.saving ? 'Saving…' : 'Update email'}
          </button>
        </form>
      </Section>

      <Section title="Change password" theme={theme}>
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={label}>Current password</label>
            <input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} required style={input} />
          </div>
          <div>
            <label style={label}>New password</label>
            <input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} required minLength={8} style={input} />
          </div>
          <div>
            <label style={label}>Confirm new password</label>
            <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required style={input} />
          </div>
          {pwState.error && <div style={{ color: theme.error, fontSize: 13 }}>{pwState.error}</div>}
          {pwState.success && <div style={{ color: theme.primary, fontSize: 13 }}>{pwState.success}</div>}
          <button type="submit" disabled={pwState.saving} style={{ padding: '8px 14px', backgroundColor: theme.primary, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: pwState.saving ? 0.7 : 1, fontFamily: 'inherit', alignSelf: 'flex-start' }}>
            {pwState.saving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </Section>

      <Section title="Delete account" theme={theme}>
        <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12 }}>
          Permanently deletes your account and all data. This cannot be undone.
        </div>
        <form onSubmit={handleDelete} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={label}>Confirm password</label>
            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required style={input} />
          </div>
          {deleteState.error && <div style={{ color: theme.error, fontSize: 13 }}>{deleteState.error}</div>}
          <button type="submit" disabled={deleteState.saving} style={{ padding: '8px 14px', backgroundColor: theme.error, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deleteState.saving ? 0.7 : 1, fontFamily: 'inherit', alignSelf: 'flex-start' }}>
            {deleteState.saving ? 'Deleting…' : 'Delete account'}
          </button>
        </form>
      </Section>
    </SettingsLayout>
  );
}
