import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as authApi from '../auth';
import * as nutritionApi from '../nutrition';
import * as fitnessApi from '../fitness';
import * as sleepApi from '../sleep';
import * as productivityApi from '../productivity';

const fetchMock = vi.fn();

function makeResponse({ ok = true, status = 200, jsonData = null, textData }: { ok?: boolean; status?: number; jsonData?: unknown; textData?: string } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(jsonData),
    text: vi.fn().mockResolvedValue(textData ?? (jsonData == null ? '' : JSON.stringify(jsonData)))
  };
}

describe('client api wrappers', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('auth api', () => {
    it('posts login payload and returns user', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ jsonData: { user: { id: 1 } } }));

      const result = await authApi.login('u@example.com', 'password123');

      expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));
      expect(result).toEqual({ user: { id: 1 } });
    });

    it('throws status error on me() failure', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ ok: false, status: 401, jsonData: { error: 'Unauthorized' } }));

      await expect(authApi.me()).rejects.toMatchObject({ message: 'Unauthorized', status: 401 });
    });

    it('throws login fallback error when error payload is missing', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ ok: false, textData: '' }));

      await expect(authApi.login('u@example.com', 'bad-password')).rejects.toThrow('Login failed');
    });
  });

  describe('nutrition api', () => {
    it('encodes query for water entries', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ jsonData: [] }));

      await nutritionApi.getWaterEntries({ since: '2026-03-02T10:00:00.000Z' });

      expect(fetchMock).toHaveBeenCalledWith('/api/nutrition/water/entries?since=2026-03-02T10%3A00%3A00.000Z');
    });

    it('throws server error payload for postWater', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ ok: false, status: 400, jsonData: { error: 'bad input' } }));

      await expect(nutritionApi.postWater({ volumeMl: 0 })).rejects.toThrow('bad input');
    });

    it('deletes weight entry with encoded id', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ jsonData: { ok: true } }));

      const result = await nutritionApi.deleteWeightEntry('abc/123');

      expect(fetchMock).toHaveBeenCalledWith('/api/nutrition/weight/abc%2F123', { method: 'DELETE' });
      expect(result).toEqual({ ok: true });
    });

    it('calls base foods endpoint when getFoodEntries has no since filter', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ jsonData: [] }));

      const result = await nutritionApi.getFoodEntries();

      expect(fetchMock).toHaveBeenCalledWith('/api/nutrition/foods');
      expect(result).toEqual([]);
    });
  });

  describe('fitness api', () => {
    it('returns [] when getSplits payload is not an array', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ jsonData: { error: true } }));

      const result = await fitnessApi.getSplits();
      expect(result).toEqual([]);
    });

    it('posts split creation payload', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ jsonData: { id: 10 } }));

      const result = await fitnessApi.createSplit('PPL', 3);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/fitness/splits',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'PPL', days: 3 })
        })
      );
      expect(result).toEqual({ id: 10 });
    });

    it('returns parsed split payload for getSplit', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ jsonData: { id: 55, name: 'Upper Lower' } }));

      const split = await fitnessApi.getSplit(55);

      expect(fetchMock).toHaveBeenCalledWith('/api/fitness/splits/55');
      expect(split).toEqual({ id: 55, name: 'Upper Lower' });
    });
  });

  describe('sleep api', () => {
    it('returns summary payload', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ jsonData: { count: 5 } }));

      const summary = await sleepApi.getSleepSummary({ days: 14 });

      expect(fetchMock).toHaveBeenCalledWith('/api/sleep/summary?days=14');
      expect(summary).toEqual({ count: 5 });
    });

    it('throws fallback error when delete fails without JSON body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error('no json'))
      });

      await expect(sleepApi.deleteSleepSession(12)).rejects.toThrow('Failed to delete sleep session');
    });

    it('throws fallback error when createSleepSession fails without JSON payload', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error('bad json'))
      });

      await expect(
        sleepApi.createSleepSession({
          startTime: '2026-03-02T22:00:00.000Z',
          endTime: '2026-03-03T06:00:00.000Z'
        })
      ).rejects.toThrow('Failed to create sleep session');
    });
  });

  describe('productivity api', () => {
    it('throws createTask error payload', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ ok: false, jsonData: { error: 'title required' } }));

      await expect(productivityApi.createTask({ title: '' })).rejects.toThrow('title required');
    });

    it('returns true when deleteTask receives 204', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 204 });

      const result = await productivityApi.deleteTask(1);
      expect(result).toBe(true);
    });

    it('throws deleteTask error when response is not ok and not 204', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(productivityApi.deleteTask(1)).rejects.toThrow('Failed to delete task');
    });
  });
});