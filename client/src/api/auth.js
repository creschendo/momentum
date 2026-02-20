async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function me() {
  const res = await fetch('/api/auth/me');
  const data = await safeJson(res);
  if (!res.ok) {
    const err = new Error(data?.error || 'Failed to get session');
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || 'Login failed');
  return data;
}

export async function register(email, password, displayName) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName })
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || 'Registration failed');
  return data;
}

export async function logout() {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || 'Logout failed');
  return data;
}
