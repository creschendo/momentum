export async function getSleepSessions({ limit = 30 } = {}) {
  const res = await fetch(`/api/sleep/sessions?limit=${encodeURIComponent(limit)}`);
  if (!res.ok) throw new Error('Failed to fetch sleep sessions');
  return res.json();
}

export async function createSleepSession({ startTime, endTime, quality, notes }) {
  const res = await fetch('/api/sleep/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startTime, endTime, quality, notes })
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || 'Failed to create sleep session');
  }

  return res.json();
}

export async function deleteSleepSession(id) {
  const res = await fetch(`/api/sleep/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || 'Failed to delete sleep session');
  }

  return res.json();
}

export async function getSleepSummary({ days = 7 } = {}) {
  const res = await fetch(`/api/sleep/summary?days=${encodeURIComponent(days)}`);
  if (!res.ok) throw new Error('Failed to fetch sleep summary');
  return res.json();
}
