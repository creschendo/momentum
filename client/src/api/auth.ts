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
