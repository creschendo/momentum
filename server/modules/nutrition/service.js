// Simple in-memory service for water intake tracking.
// For real apps, replace with a persistent repository (DB).

const entries = [];

function addWaterEntry({ volumeMl, timestamp }) {
  const ts = timestamp ? new Date(timestamp) : new Date();
  const entry = { id: String(Date.now()) + Math.random().toString(36).slice(2), volumeMl, timestamp: ts.toISOString() };
  entries.push(entry);
  return entry;
}

function listEntries({ since } = {}) {
  if (!since) return [...entries].sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
  const sinceDate = new Date(since);
  return entries.filter(e => new Date(e.timestamp) >= sinceDate).sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp));
}

function sumForPeriod(period = 'daily') {
  // period: 'daily' | 'weekly' | 'monthly'
  const now = new Date();
  let start;
  if (period === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'weekly') {
    // week starting Monday
    const day = now.getDay();
    const diff = (day + 6) % 7; // days since Monday
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    throw new Error('invalid period');
  }
  const total = entries.reduce((acc, e) => {
    const t = new Date(e.timestamp);
    if (t >= start) return acc + Number(e.volumeMl || 0);
    return acc;
  }, 0);
  return { period, start: start.toISOString(), totalMl: total };
}

export default { addWaterEntry, listEntries, sumForPeriod };
