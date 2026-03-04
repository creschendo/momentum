import { describe, it, expect, vi, beforeEach } from 'vitest';
import pool from '../../../db.js';
import service from '../service.js';

vi.mock('../../../db.js', () => ({
  default: {
    query: vi.fn()
  }
}));

describe('sleep service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates, lists, summarizes, and deletes sessions', async () => {
    const createdAt = new Date().toISOString();
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            startTime: '2026-02-25T23:00:00.000Z',
            endTime: '2026-02-26T07:00:00.000Z',
            quality: 4,
            notes: 'Solid sleep',
            createdAt
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            startTime: '2026-02-25T23:00:00.000Z',
            endTime: '2026-02-26T07:00:00.000Z',
            quality: 4,
            notes: 'Solid sleep',
            createdAt
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            startTime: '2026-02-25T23:00:00.000Z',
            endTime: '2026-02-26T07:00:00.000Z',
            quality: 4,
            notes: 'Solid sleep',
            createdAt
          }
        ]
      })
      .mockResolvedValueOnce({ rowCount: 1 });

    const created = await service.addSleepSession({
      userId: 1,
      startTime: '2026-02-25T23:00:00.000Z',
      endTime: '2026-02-26T07:00:00.000Z',
      quality: 4,
      notes: 'Solid sleep'
    });
    expect(created).toHaveProperty('id', 1);
    expect(created).toHaveProperty('durationHours', 8);

    const list = await service.listSleepSessions({ userId: 1, limit: 20 });
    expect(Array.isArray(list)).toBe(true);
    expect(list[0]).toHaveProperty('quality', 4);

    const summary = await service.getSleepSummary({ userId: 1, days: 7 });
    expect(summary).toMatchObject({ days: 7, count: 1, avgDurationHours: 8, avgQuality: 4 });

    const deleted = await service.deleteSleepSession({ userId: 1, id: 1 });
    expect(deleted).toBe(true);
  });

  it('returns zeroed summary values and minimum days clamp when no sessions exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const summary = await service.getSleepSummary({ userId: 1, days: 1 });
    expect(summary).toEqual({
      days: 3,
      count: 0,
      avgDurationHours: 0,
      avgQuality: 0,
      latest: null
    });
  });

  it('returns false when deleteSleepSession affects no rows', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await service.deleteSleepSession({ userId: 1, id: 999 });
    expect(deleted).toBe(false);
  });
});
