import { describe, it, expect } from 'vitest';
import service from '../service.js';

describe('productivity service (tasks)', () => {
  it('creates, lists, updates, and removes tasks', () => {
    const t1 = service.createTask({ title: 'Test task 1', notes: 'note' });
    expect(t1).toHaveProperty('id');
    expect(t1).toHaveProperty('title', 'Test task 1');

    const t2 = service.createTask({ title: 'Second task' });
    const list = service.listTasks();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(2);

    const updated = service.updateTask(t1.id, { done: true });
    expect(updated).not.toBeNull();
    expect(updated.done).toBe(true);

    const ok = service.removeTask(t2.id);
    expect(ok).toBe(true);
    const after = service.getTask(t2.id);
    expect(after).toBeNull();
  });
});
