import { describe, it, expect, vi, beforeEach } from 'vitest';
import pool from '../../../db.js';
import {
  addSplit,
  deleteSplit,
  addLiftToDay
} from '../service.js';

vi.mock('../../../db.js', () => ({
  default: {
    query: vi.fn()
  }
}));

describe('fitness service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates split days based on daysCount', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 9,
            name: 'PPL',
            description: '',
            daysCount: 2,
            createdAt: '2026-03-02T00:00:00.000Z'
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [{ id: 100 }] })
      .mockResolvedValueOnce({ rows: [{ id: 101 }] });

    const split = await addSplit({ userId: 1, name: 'PPL', daysCount: 2 });

    expect(split.id).toBe(9);
    expect(split.days).toHaveLength(2);
    expect(split.days[0]).toMatchObject({ id: 100, name: 'Day 1' });
    expect(split.days[1]).toMatchObject({ id: 101, name: 'Day 2' });
  });

  it('returns false when deleteSplit removes no rows', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const removed = await deleteSplit({ userId: 1, id: 999 });
    expect(removed).toBe(false);
  });

  it('returns null when addLiftToDay day check fails', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const lift = await addLiftToDay({
      userId: 1,
      splitId: 3,
      dayId: 4,
      lift: { exerciseName: 'Squat', sets: 3, reps: 5, weight: 225 }
    });

    expect(lift).toBeNull();
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});