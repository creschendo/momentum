import { describe, it, expect, vi, beforeEach } from 'vitest';
import pool from '../../../db.js';
import service from '../service.js';

vi.mock('../../../db.js', () => ({
  default: {
    query: vi.fn()
  }
}));

describe('nutrition service (water)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a water entry and returns correct shape', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, volumeMl: 300, timestamp: new Date().toISOString() }]
    });

    const entry = await service.addWaterEntry({ userId: 1, volumeMl: 300 });
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('volumeMl', 300);
    expect(entry).toHaveProperty('timestamp');
  });

  it('sums water for the daily period', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 10, volumeMl: 200, timestamp: new Date().toISOString() }] })
      .mockResolvedValueOnce({ rows: [{ id: 11, volumeMl: 500, timestamp: new Date().toISOString() }] })
      .mockResolvedValueOnce({ rows: [{ total: 700 }] });

    await service.addWaterEntry({ userId: 1, volumeMl: 200 });
    await service.addWaterEntry({ userId: 1, volumeMl: 500 });
    const summary = await service.sumForPeriod({ userId: 1, period: 'daily' });
    expect(summary).toHaveProperty('period', 'daily');
    expect(summary).toHaveProperty('totalMl');
    expect(typeof summary.totalMl).toBe('number');
    expect(summary.totalMl).toBeGreaterThanOrEqual(700);
  });
});
