import { describe, it, expect, beforeEach } from 'vitest';
import service from '../service.js';

describe('nutrition service (water)', () => {
  // clear module-level entries between tests by re-importing a fresh module is tricky in ESM tests
  // but our in-memory service exposes new arrays, so we'll rely on times to avoid collisions.

  it('adds a water entry and returns correct shape', () => {
    const entry = service.addWaterEntry({ volumeMl: 300 });
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('volumeMl', 300);
    expect(entry).toHaveProperty('timestamp');
  });

  it('sums water for the daily period', () => {
    // create entries for today
    service.addWaterEntry({ volumeMl: 200 });
    service.addWaterEntry({ volumeMl: 500 });
    const summary = service.sumForPeriod('daily');
    expect(summary).toHaveProperty('period', 'daily');
    expect(summary).toHaveProperty('totalMl');
    expect(typeof summary.totalMl).toBe('number');
    expect(summary.totalMl).toBeGreaterThanOrEqual(700);
  });
});
