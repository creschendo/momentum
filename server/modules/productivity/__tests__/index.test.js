import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../index.js';
import service from '../service.js';
import {
  getRouteMethodsByPath,
  hasRoute,
  getRouteHandler,
  runRoute
} from '../../__tests__/routerTestUtils.js';

describe('productivity router scaffolding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers status, events, and task routes', () => {
    const routes = getRouteMethodsByPath(router);

    expect(hasRoute(routes, '/status', 'get')).toBe(true);
    expect(hasRoute(routes, '/events', 'get')).toBe(true);
    expect(hasRoute(routes, '/events', 'post')).toBe(true);
    expect(hasRoute(routes, '/events/:id', 'patch')).toBe(true);
    expect(hasRoute(routes, '/events/:id', 'delete')).toBe(true);
    expect(hasRoute(routes, '/tasks', 'get')).toBe(true);
    expect(hasRoute(routes, '/tasks', 'post')).toBe(true);
    expect(hasRoute(routes, '/tasks/:id', 'patch')).toBe(true);
    expect(hasRoute(routes, '/tasks/:id', 'delete')).toBe(true);
  });

  it('creates and updates an event', async () => {
    vi.spyOn(service, 'createEvent').mockResolvedValueOnce({ id: 1, title: 'Planning' });
    vi.spyOn(service, 'updateEvent').mockResolvedValueOnce({ id: 1, title: 'Planning v2' });

    const createHandler = getRouteHandler(router, 'post', '/events');
    const createRes = await runRoute(createHandler, {
      user: { id: 10 },
      body: { title: 'Planning', dateKey: '2026-03-02', time: '09:30', description: 'sync' }
    });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body).toEqual({ id: 1, title: 'Planning' });
    expect(service.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 10, title: 'Planning', dateKey: '2026-03-02', time: '09:30' })
    );

    const patchHandler = getRouteHandler(router, 'patch', '/events/:id');
    const patchRes = await runRoute(patchHandler, {
      user: { id: 10 },
      params: { id: '1' },
      body: { title: 'Planning v2' }
    });

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body).toEqual({ id: 1, title: 'Planning v2' });
  });

  it('creates and completes a task', async () => {
    vi.spyOn(service, 'createTask').mockResolvedValueOnce({ id: 25, title: 'Ship tests', done: false });
    vi.spyOn(service, 'updateTask').mockResolvedValueOnce({ id: 25, title: 'Ship tests', done: true });

    const createTaskHandler = getRouteHandler(router, 'post', '/tasks');
    const createRes = await runRoute(createTaskHandler, {
      user: { id: 10 },
      body: { title: 'Ship tests', notes: '' }
    });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body).toEqual({ id: 25, title: 'Ship tests', done: false });

    const patchTaskHandler = getRouteHandler(router, 'patch', '/tasks/:id');
    const patchRes = await runRoute(patchTaskHandler, {
      user: { id: 10 },
      params: { id: '25' },
      body: { done: true }
    });

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body).toEqual({ id: 25, title: 'Ship tests', done: true });
  });
});
