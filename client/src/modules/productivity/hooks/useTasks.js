import { useCallback, useEffect, useState } from 'react';
import { getTasks, createTask, patchTask, deleteTask } from '../../../api/productivity';

export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getTasks();
      setTasks(list);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async ({ title, notes }) => {
    try {
      setLoading(true);
      const created = await createTask({ title, notes });
      setTasks((s) => [created, ...s]);
      return created;
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleDone = useCallback(async (id, done) => {
    try {
      setLoading(true);
      const updated = await patchTask(id, { done });
      setTasks((s) => s.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id) => {
    try {
      setLoading(true);
      await deleteTask(id);
      setTasks((s) => s.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { tasks, loading, error, fetchTasks, addTask, toggleDone, remove };
}
