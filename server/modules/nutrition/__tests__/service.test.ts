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

  it('throws for unsupported period values', async () => {
    await expect(service.sumForPeriod({ userId: 1, period: 'yearly' })).rejects.toThrow('invalid period');
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('returns weight trend stats and enforces minimum day window', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, weightKg: 80.5, entryDate: '2026-02-20', note: '' },
        { id: 2, weightKg: 79.8, entryDate: '2026-02-26', note: '' }
      ]
    });

    const trend = await service.getWeightTrend({ userId: 2, days: 1 });
    expect(trend.days).toBe(7);
    expect(trend.points).toHaveLength(2);
    expect(trend.stats).toMatchObject({
      count: 2,
      latestKg: 79.8,
      startKg: 80.5,
      changeKg: -0.7
    });
  });

  it('returns false when deleting a non-existent weight entry', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const removed = await service.deleteWeightEntry({ userId: 1, id: 999 });
    expect(removed).toBe(false);
  });
});
