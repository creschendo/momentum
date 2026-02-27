import { describe, it, expect, vi, beforeEach } from 'vitest';
import pool from '../../../db.js';
import service from '../service.js';

vi.mock('../../../db.js', () => ({
  default: {
    query: vi.fn()
  }
}));

describe('productivity service (tasks)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates, lists, updates, and removes tasks', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Test task 1', notes: 'note', done: false }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, title: 'Second task', notes: '', done: false }] })
      .mockResolvedValueOnce({ rows: [
        { id: 2, title: 'Second task', notes: '', done: false },
        { id: 1, title: 'Test task 1', notes: 'note', done: false }
      ] })
      .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Test task 1', notes: 'note', done: false }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Test task 1', notes: 'note', done: true }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [] });

    const t1 = await service.createTask({ title: 'Test task 1', notes: 'note' });
    expect(t1).toHaveProperty('id');
    expect(t1).toHaveProperty('title', 'Test task 1');

    const t2 = await service.createTask({ title: 'Second task' });
    const list = await service.listTasks();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(2);

    const updated = await service.updateTask(t1.id, { done: true });
    expect(updated).not.toBeNull();
    expect(updated.done).toBe(true);

    const ok = await service.removeTask(t2.id);
    expect(ok).toBe(true);
    const after = await service.getTask(t2.id);
    expect(after).toBeNull();
  });
});
