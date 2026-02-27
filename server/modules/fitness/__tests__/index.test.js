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

describe('fitness router scaffolding', () => {
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

  it.todo('returns module status payload from /status');
  it.todo('creates a split via POST /splits');
  it.todo('adds and removes day/lift/cardio resources');
});
