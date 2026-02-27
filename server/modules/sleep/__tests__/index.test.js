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

describe('sleep router scaffolding', () => {
  it('registers status, sessions, and summary routes', () => {
    const routes = getRouteMethodsByPath(router);

    expect(hasRoute(routes, '/status', 'get')).toBe(true);
    expect(hasRoute(routes, '/sessions', 'get')).toBe(true);
    expect(hasRoute(routes, '/sessions', 'post')).toBe(true);
    expect(hasRoute(routes, '/sessions/:id', 'delete')).toBe(true);
    expect(hasRoute(routes, '/summary', 'get')).toBe(true);
  });

  it.todo('rejects invalid start/end timestamps for POST /sessions');
  it.todo('returns sleep summary payload from /summary');
});
