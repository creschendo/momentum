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
});
