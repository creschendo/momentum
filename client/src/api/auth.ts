// Auth API — session management, user registration/login, profile, account settings, and active sessions.
// All requests rely on the session cookie set by the server; no explicit token handling is needed client-side.

type AuthApiError = Error & { status?: number };

/** Core user identity returned by the server after authentication. */
export interface AuthUser {
  id: number;
  email: string;
  displayName?: string;
  createdAt?: string;
}

/** Wrapper returned by login, register, and me endpoints. */
export interface AuthPayload {
  user: AuthUser;
}

/**
 * Safely parses a JSON response body, returning null for empty or malformed bodies.
 * Prevents unhandled parse errors when the server returns a non-JSON error response.
 */
async function safeJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Fetches the currently authenticated user from the active session. Throws if unauthenticated. */
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

/** Authenticates with email and password, establishing a server-side session. */
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

/** Creates a new user account and returns the authenticated session payload. */
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

/** Destroys the current session on the server and clears the session cookie. */
export async function logout(): Promise<{ ok: boolean }> {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  const data = await safeJson<{ error?: string; ok?: boolean }>(res);
  if (!res.ok) throw new Error(data?.error || 'Logout failed');
  return { ok: Boolean(data?.ok) };
}

// ── Profile ───────────────────────────────────────────────────────────────────

/** Extended user profile with physical attributes used for health calculations (e.g. TDEE). */
export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  dateOfBirth?: string;
  sex?: string;
  heightCm?: number;
  createdAt?: string;
}

/** Retrieves the full profile for the authenticated user. */
export async function getProfile(): Promise<UserProfile> {
  const res = await fetch('/api/auth/profile');
  const data = await safeJson<{ error?: string; profile?: UserProfile }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to get profile');
  return data!.profile!;
}

/** Updates one or more profile fields for the authenticated user. */
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

/** Changes the account email. Requires current password for verification. */
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

/** Changes the account password after verifying the current one. */
export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await safeJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to update password');
}

/** Permanently deletes the authenticated user's account. Requires password confirmation. */
export async function deleteAccount(password: string): Promise<void> {
  const res = await fetch('/api/auth/account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await safeJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to delete account');
}

// ── Password reset ────────────────────────────────────────────────────────────

/** Requests a password reset email for the given address.
 *  Always resolves — server never reveals whether the email exists. */
export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await safeJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to send reset email');
}

/** Consumes a reset token and sets a new password. */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword })
  });
  const data = await safeJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to reset password');
}

// ── Sessions ──────────────────────────────────────────────────────────────────

/** Metadata for an active login session, used to display and manage connected devices. */
export interface SessionInfo {
  id: number;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  isCurrent: boolean;
}

/** Returns all active sessions for the authenticated user, including the current one. */
export async function getSessions(): Promise<SessionInfo[]> {
  const res = await fetch('/api/auth/sessions');
  const data = await safeJson<{ error?: string; sessions?: SessionInfo[] }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to get sessions');
  return data!.sessions!;
}

/** Revokes a specific session by ID, immediately signing out that device. */
export async function revokeSession(id: number): Promise<void> {
  const res = await fetch(`/api/auth/sessions/${id}`, { method: 'DELETE' });
  const data = await safeJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data?.error || 'Failed to revoke session');
}
