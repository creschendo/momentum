export interface SleepSessionInput {
  startTime: string;
  endTime: string;
  quality?: number;
  notes?: string;
}

export interface SleepSession {
  id: number | string;
  startTime: string;
  endTime: string;
  quality: number;
  notes: string;
  createdAt?: string;
  durationHours?: number;
}

export async function getSleepSessions({ limit = 30 }: { limit?: number } = {}): Promise<SleepSession[]> {
  const res = await fetch(`/api/sleep/sessions?limit=${encodeURIComponent(limit)}`);
  if (!res.ok) throw new Error('Failed to fetch sleep sessions');
  return res.json() as Promise<SleepSession[]>;
}

export async function createSleepSession({ startTime, endTime, quality, notes }: SleepSessionInput): Promise<SleepSession> {
  const res = await fetch('/api/sleep/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startTime, endTime, quality, notes })
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || 'Failed to create sleep session');
  }

  return res.json() as Promise<SleepSession>;
}

export async function deleteSleepSession(id: number | string): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/sleep/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || 'Failed to delete sleep session');
  }

  return res.json() as Promise<{ ok: boolean }>;
}

export async function getSleepSummary({ days = 7 }: { days?: number } = {}): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/sleep/summary?days=${encodeURIComponent(days)}`);
  if (!res.ok) throw new Error('Failed to fetch sleep summary');
  return res.json() as Promise<Record<string, unknown>>;
}
