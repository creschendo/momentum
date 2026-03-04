import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../index.js';
import * as service from '../service.js';
import {
  getRouteMethodsByPath,
  hasRoute,
  getRouteHandler,
  runRoute
} from '../../__tests__/routerTestUtils.js';

describe('fitness router scaffolding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers status and split routes', () => {
    const routes = getRouteMethodsByPath(router);

    expect(hasRoute(routes, '/status', 'get')).toBe(true);
    expect(hasRoute(routes, '/splits', 'get')).toBe(true);
    expect(hasRoute(routes, '/splits', 'post')).toBe(true);
    expect(hasRoute(routes, '/splits/:id', 'get')).toBe(true);
    expect(hasRoute(routes, '/splits/:id', 'put')).toBe(true);
    expect(hasRoute(routes, '/splits/:id', 'delete')).toBe(true);
    expect(hasRoute(routes, '/splits/:splitId/days', 'post')).toBe(true);
  });

  it('returns module status payload from /status', async () => {
    const statusHandler = getRouteHandler(router, 'get', '/status');
    const res = await runRoute(statusHandler, { user: { id: 1 } });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ module: 'fitness', status: 'ok', info: 'Fitness module ready' });
  });

  it('creates a split via POST /splits', async () => {
    vi.spyOn(service, 'addSplit').mockResolvedValueOnce({ id: 1, name: 'Push Pull Legs', daysCount: 3, days: [] });

    const createHandler = getRouteHandler(router, 'post', '/splits');
    const res = await runRoute(createHandler, {
      user: { id: 5 },
      body: { title: 'Push Pull Legs', days: 3 }
    });

    expect(service.addSplit).toHaveBeenCalledWith({ userId: 5, name: 'Push Pull Legs', daysCount: 3 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ id: 1, name: 'Push Pull Legs' });
  });

  it('adds and removes day/lift/cardio resources', async () => {
    vi.spyOn(service, 'addDayToSplit').mockResolvedValueOnce({ id: 10, name: 'Leg Day', lifts: [], cardio: [] });
    vi.spyOn(service, 'removeLiftFromDay').mockResolvedValueOnce(true);
    vi.spyOn(service, 'removeCardioFromDay').mockResolvedValueOnce(true);

    const addDayHandler = getRouteHandler(router, 'post', '/splits/:splitId/days');
    const addDayRes = await runRoute(addDayHandler, {
      user: { id: 5 },
      params: { splitId: '3' },
      body: { name: 'Leg Day' }
    });
    expect(addDayRes.statusCode).toBe(201);
    expect(addDayRes.body).toMatchObject({ id: 10, name: 'Leg Day' });

    const deleteLiftHandler = getRouteHandler(router, 'delete', '/splits/:splitId/days/:dayId/lifts/:liftId');
    const deleteLiftRes = await runRoute(deleteLiftHandler, {
      user: { id: 5 },
      params: { splitId: '3', dayId: '10', liftId: '77' }
    });
    expect(deleteLiftRes.statusCode).toBe(200);
    expect(deleteLiftRes.body).toEqual({ message: 'Lift deleted' });

    const deleteCardioHandler = getRouteHandler(router, 'delete', '/splits/:splitId/days/:dayId/cardio/:cardioId');
    const deleteCardioRes = await runRoute(deleteCardioHandler, {
      user: { id: 5 },
      params: { splitId: '3', dayId: '10', cardioId: '11' }
    });
    expect(deleteCardioRes.statusCode).toBe(200);
    expect(deleteCardioRes.body).toEqual({ message: 'Cardio session deleted' });
  });

  it('returns 400 when split payload is missing required fields', async () => {
    const createHandler = getRouteHandler(router, 'post', '/splits');
    const res = await runRoute(createHandler, {
      user: { id: 5 },
      body: { title: '', days: null }
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Name and days are required' });
    expect(service.addSplit).not.toHaveBeenCalled();
  });

  it('returns 404 when requested split is missing', async () => {
    vi.spyOn(service, 'getSplit').mockResolvedValueOnce(null);

    const getHandler = getRouteHandler(router, 'get', '/splits/:id');
    const res = await runRoute(getHandler, {
      user: { id: 5 },
      params: { id: '404' }
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Split not found' });
  });

  it('returns 404 when deleting a missing split', async () => {
    vi.spyOn(service, 'deleteSplit').mockResolvedValueOnce(false);

    const deleteHandler = getRouteHandler(router, 'delete', '/splits/:id');
    const res = await runRoute(deleteHandler, {
      user: { id: 5 },
      params: { id: '404' }
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Split not found' });
  });
});
