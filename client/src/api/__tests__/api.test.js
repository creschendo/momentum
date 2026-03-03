import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as authApi from '../auth.js';
import * as nutritionApi from '../nutrition.js';
import * as fitnessApi from '../fitness.js';
import * as sleepApi from '../sleep.js';
import * as productivityApi from '../productivity.js';

function makeResponse({ ok = true, status = 200, jsonData = null, textData } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(jsonData),
    text: vi.fn().mockResolvedValue(textData ?? (jsonData == null ? '' : JSON.stringify(jsonData)))
  };
}

describe('client api wrappers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('auth api', () => {
    it('posts login payload and returns user', async () => {
      fetch.mockResolvedValueOnce(makeResponse({ jsonData: { user: { id: 1 } } }));

      const result = await authApi.login('u@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));
      expect(result).toEqual({ user: { id: 1 } });
    });

    it('throws status error on me() failure', async () => {
      fetch.mockResolvedValueOnce(makeResponse({ ok: false, status: 401, jsonData: { error: 'Unauthorized' } }));

      await expect(authApi.me()).rejects.toMatchObject({ message: 'Unauthorized', status: 401 });
    });
  });

  describe('nutrition api', () => {
    it('encodes query for water entries', async () => {
      fetch.mockResolvedValueOnce(makeResponse({ jsonData: [] }));

      await nutritionApi.getWaterEntries({ since: '2026-03-02T10:00:00.000Z' });

      expect(fetch).toHaveBeenCalledWith('/api/nutrition/water/entries?since=2026-03-02T10%3A00%3A00.000Z');
    });

    it('throws server error payload for postWater', async () => {
      fetch.mockResolvedValueOnce(makeResponse({ ok: false, status: 400, jsonData: { error: 'bad input' } }));

      await expect(nutritionApi.postWater({ volumeMl: 0 })).rejects.toThrow('bad input');
    });

    it('deletes weight entry with encoded id', async () => {
      fetch.mockResolvedValueOnce(makeResponse({ jsonData: { ok: true } }));

      const result = await nutritionApi.deleteWeightEntry('abc/123');

      expect(fetch).toHaveBeenCalledWith('/api/nutrition/weight/abc%2F123', { method: 'DELETE' });
      expect(result).toEqual({ ok: true });
    });
  });

  describe('fitness api', () => {
    it('returns [] when getSplits payload is not an array', async () => {
      fetch.mockResolvedValueOnce(makeResponse({ jsonData: { error: true } }));

      const result = await fitnessApi.getSplits();
      expect(result).toEqual([]);
    });

    it('posts split creation payload', async () => {
      fetch.mockResolvedValueOnce(makeResponse({ jsonData: { id: 10 } }));

      const result = await fitnessApi.createSplit('PPL', 3);

      expect(fetch).toHaveBeenCalledWith(
        '/api/fitness/splits',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'PPL', days: 3 })
        })
      );
      expect(result).toEqual({ id: 10 });
    });
  });

  describe('sleep api', () => {
    it('returns summary payload', async () => {
      fetch.mockResolvedValueOnce(makeResponse({ jsonData: { count: 5 } }));

      const summary = await sleepApi.getSleepSummary({ days: 14 });

      expect(fetch).toHaveBeenCalledWith('/api/sleep/summary?days=14');
      expect(summary).toEqual({ count: 5 });
    });

    it('throws fallback error when delete fails without JSON body', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error('no json'))
      });

      await expect(sleepApi.deleteSleepSession(12)).rejects.toThrow('Failed to delete sleep session');
    });
  });

  describe('productivity api', () => {
    it('throws createTask error payload', async () => {
      fetch.mockResolvedValueOnce(makeResponse({ ok: false, jsonData: { error: 'title required' } }));

      await expect(productivityApi.createTask({ title: '' })).rejects.toThrow('title required');
    });

    it('returns true when deleteTask receives 204', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 204 });

      const result = await productivityApi.deleteTask(1);
      expect(result).toBe(true);
    });
  });
});