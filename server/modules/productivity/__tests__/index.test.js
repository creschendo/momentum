import { describe, it, expect } from 'vitest';
import router from '../index.js';

function getRouteMethodsByPath(expressRouter) {
  return (expressRouter.stack || [])
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {})
    }));
}

function hasRoute(routes, path, method) {
  return routes.some((route) => route.path === path && route.methods.includes(method));
}

describe('productivity router scaffolding', () => {
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

  it.todo('creates and updates an event');
  it.todo('creates and completes a task');
});
