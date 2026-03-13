type AuthApiError = Error & { status?: number };

export interface AuthUser {
  id: number;
  email: string;
  displayName?: string;
  createdAt?: string;
}

export interface AuthPayload {
  user: AuthUser;
}

async function safeJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function me(): Promise<AuthPayload> {
  const res = await fetch('/api/auth/me');
  const data = await safeJson<{ error?: string } & Partial<AuthPayload>>(res);
  if (!res.ok) {
    const err: AuthApiError = new Error(data?.error || 'Failed to get session');
    err.status = res.status;
    throw err;
  }
  return data as AuthPayload;
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await safeJson<{ error?: string } & Partial<AuthPayload>>(res);
  if (!res.ok) throw new Error(data?.error || 'Login failed');
  return data as AuthPayload;
}

export async function register(email: string, password: string, displayName: string): Promise<AuthPayload> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName })
  });
  const data = await safeJson<{ error?: string } & Partial<AuthPayload>>(res);
  if (!res.ok) throw new Error(data?.error || 'Registration failed');
  return data as AuthPayload;
}

export async function logout(): Promise<{ ok: boolean }> {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  const data = await safeJson<{ error?: string; ok?: boolean }>(res);
  if (!res.ok) throw new Error(data?.error || 'Logout failed');
  return { ok: Boolean(data?.ok) };
}

// ── Profile ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  dateOfBirth?: string;
  sex?: string;
  heightCm?: number;
  createdAt?: string;
}

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch('/api/auth/profile');
  const data = await safeJson<{ error?: string; profile?: UserProfile }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to get profile');
  return data!.profile!;
}

export async function updateProfile(profile: Partial<Pick<UserProfile, 'displayName' | 'dateOfBirth' | 'sex' | 'heightCm'>>): Promise<UserProfile> {
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  const data = await safeJson<{ error?: string; profile?: UserProfile }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to update profile');
  return data!.profile!;
}

// ── Account ───────────────────────────────────────────────────────────────────

export async function updateEmail(email: string, password: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/email', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await safeJson<{ error?: string; user?: AuthUser }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to update email');
  return data!.user!;
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await safeJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to update password');
}

export async function deleteAccount(password: string): Promise<void> {
  const res = await fetch('/api/auth/account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await safeJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to delete account');
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface SessionInfo {
  id: number;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  isCurrent: boolean;
}

export async function getSessions(): Promise<SessionInfo[]> {
  const res = await fetch('/api/auth/sessions');
  const data = await safeJson<{ error?: string; sessions?: SessionInfo[] }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to get sessions');
  return data!.sessions!;
}

export async function revokeSession(id: number): Promise<void> {
  const res = await fetch(`/api/auth/sessions/${id}`, { method: 'DELETE' });
  const data = await safeJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to revoke session');
}
