// useTasks — hook managing the full task list for the Tasks component (fetch, create, toggle, delete).
import { useCallback, useEffect, useState } from 'react';
import { getTasks, createTask, patchTask, deleteTask, type Task } from '../../../../api/productivity';

/** Extracts a string error message from any thrown value. */
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Provides task list state and actions.
 * - New tasks are optimistically prepended to the list on creation.
 * - `toggleDone` patches only the `done` field via PATCH and updates the item in-place.
 * - `remove` deletes and filters from local state immediately.
 */
export default function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const list = await getTasks();
      setTasks(list);
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async ({ title, notes }: { title: string; notes?: string }): Promise<Task> => {
    try {
      setLoading(true);
      const created = await createTask({ title, notes });
      setTasks((s) => [created, ...s]);
      return created;
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleDone = useCallback(async (id: number | string, done: boolean): Promise<Task> => {
    try {
      setLoading(true);
      const updated = await patchTask(id, { done });
      setTasks((s) => s.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: number | string): Promise<true> => {
    try {
      setLoading(true);
      await deleteTask(id);
      setTasks((s) => s.filter((t) => t.id !== id));
      return true;
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { tasks, loading, error, fetchTasks, addTask, toggleDone, remove };
}
