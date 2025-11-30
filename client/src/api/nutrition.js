// Thin API wrapper for nutrition endpoints.
export async function postWater({ volumeMl, timestamp }) {
  const res = await fetch('/api/nutrition/water', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volumeMl, timestamp }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to post water');
  return res.json();
}

export async function getWaterEntries({ since } = {}) {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  const res = await fetch(`/api/nutrition/water/entries${q}`);
  if (!res.ok) throw new Error('Failed to get entries');
  return res.json();
}

export async function getWaterSummary({ period = 'daily' } = {}) {
  const res = await fetch(`/api/nutrition/water/summary?period=${encodeURIComponent(period)}`);
  if (!res.ok) throw new Error('Failed to get summary');
  return res.json();
}
