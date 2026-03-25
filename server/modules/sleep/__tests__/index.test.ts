import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../index.js';
import service from '../service.js';
import {
  getRouteMethodsByPath,
  hasRoute,
  getRouteHandler,
  runRoute
} from '../../__tests__/routerTestUtils.js';

describe('sleep router scaffolding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers status, sessions, and summary routes', () => {
    const routes = getRouteMethodsByPath(router);

    expect(hasRoute(routes, '/status', 'get')).toBe(true);
    expect(hasRoute(routes, '/sessions', 'get')).toBe(true);
    expect(hasRoute(routes, '/sessions', 'post')).toBe(true);
    expect(hasRoute(routes, '/sessions/:id', 'delete')).toBe(true);
    expect(hasRoute(routes, '/summary', 'get')).toBe(true);
  });

  it('rejects invalid start/end timestamps for POST /sessions', async () => {
    const createHandler = getRouteHandler(router, 'post', '/sessions');
    const res = await runRoute(createHandler, {
      user: { id: 1 },
      body: {
        startTime: '2026-03-02T08:00:00.000Z',
        endTime: '2026-03-02T06:00:00.000Z'
      }
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'endTime: endTime must be after startTime' });
  });

  it('returns sleep summary payload from /summary', async () => {
    vi.spyOn(service, 'getSleepSummary').mockResolvedValueOnce({
      days: 7,
      count: 3,
      avgDurationHours: 7.25,
      avgQuality: 4.2,
      latest: null
    });

    const summaryHandler = getRouteHandler(router, 'get', '/summary');
    const res = await runRoute(summaryHandler, {
      user: { id: 8 },
      query: { days: '7' }
    });

    expect(service.getSleepSummary).toHaveBeenCalledWith({ userId: 8, days: 7 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ count: 3, avgDurationHours: 7.25 });
  });

  it('rejects invalid date format for POST /sessions', async () => {
    const addSleepSpy = vi.spyOn(service, 'addSleepSession');
    const createHandler = getRouteHandler(router, 'post', '/sessions');
    const res = await runRoute(createHandler, {
      user: { id: 1 },
      body: {
        startTime: 'bad-date',
        endTime: '2026-03-02T06:00:00.000Z'
      }
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'startTime: Invalid date format' });

    expect(addSleepSpy).not.toHaveBeenCalled();
  });

  it('returns 404 when deleting a missing sleep session', async () => {
    vi.spyOn(service, 'deleteSleepSession').mockResolvedValueOnce(false);

    const deleteHandler = getRouteHandler(router, 'delete', '/sessions/:id');
    const res = await runRoute(deleteHandler, {
      user: { id: 8 },
      params: { id: '404' }
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Sleep session not found' });
  });

  it('returns list from /sessions with numeric limit', async () => {
    vi.spyOn(service, 'listSleepSessions').mockResolvedValueOnce([{ id: 1 }]);

    const listHandler = getRouteHandler(router, 'get', '/sessions');
    const res = await runRoute(listHandler, {
      user: { id: 8 },
      query: { limit: '14' }
    });

    expect(service.listSleepSessions).toHaveBeenCalledWith({ userId: 8, limit: 14 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1 }]);
  });
});
