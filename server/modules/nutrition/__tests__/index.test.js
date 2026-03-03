import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../index.js';
import service from '../service.js';
import {
  getRouteMethodsByPath,
  hasRoute,
  getRouteHandler,
  runRoute
} from '../../__tests__/routerTestUtils.js';

describe('nutrition router scaffolding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers core nutrition routes', () => {
    const routes = getRouteMethodsByPath(router);

    expect(hasRoute(routes, '/status', 'get')).toBe(true);
    expect(hasRoute(routes, '/water', 'post')).toBe(true);
    expect(hasRoute(routes, '/foods', 'get')).toBe(true);
    expect(hasRoute(routes, '/foods', 'post')).toBe(true);
    expect(hasRoute(routes, '/meals', 'get')).toBe(true);
    expect(hasRoute(routes, '/meals', 'post')).toBe(true);
  });

  it('validates bad water input with 400 response', async () => {
    const waterHandler = getRouteHandler(router, 'post', '/water');
    const res = await runRoute(waterHandler, {
      user: { id: 1 },
      body: { volumeMl: 0 }
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'volumeMl must be a positive number' });
  });

  it('returns food summary from /foods/summary', async () => {
    vi.spyOn(service, 'getMacroSummary').mockResolvedValueOnce({ period: 'daily', calories: 1000 });

    const summaryHandler = getRouteHandler(router, 'get', '/foods/summary');
    const res = await runRoute(summaryHandler, {
      user: { id: 99 },
      query: { period: 'daily' }
    });

    expect(service.getMacroSummary).toHaveBeenCalledWith({ userId: 99, period: 'daily' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ period: 'daily', calories: 1000 });
  });
});
