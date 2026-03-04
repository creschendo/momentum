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

  it('returns 400 for invalid water summary period', async () => {
    vi.spyOn(service, 'sumForPeriod').mockRejectedValueOnce(new Error('invalid period'));

    const summaryHandler = getRouteHandler(router, 'get', '/water/summary');
    const res = await runRoute(summaryHandler, {
      user: { id: 7 },
      query: { period: 'yearly' }
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Error: invalid period' });
  });

  it('returns 400 for meal creation without foods array', async () => {
    const mealHandler = getRouteHandler(router, 'post', '/meals');
    const res = await runRoute(mealHandler, {
      user: { id: 7 },
      body: { name: 'Lunch', foods: null }
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'name and foods array required' });
  });

  it('returns 404 when deleting a missing weight entry', async () => {
    vi.spyOn(service, 'deleteWeightEntry').mockResolvedValueOnce(false);

    const deleteHandler = getRouteHandler(router, 'delete', '/weight/:id');
    const res = await runRoute(deleteHandler, {
      user: { id: 4 },
      params: { id: '999' }
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Weight entry not found' });
  });

  it('requires query text for search endpoint', async () => {
    const searchHandler = getRouteHandler(router, 'get', '/search');
    const res = await runRoute(searchHandler, {
      user: { id: 4 },
      query: {}
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'query required' });
  });
});
