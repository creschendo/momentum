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

describe('nutrition router scaffolding', () => {
  it('registers core nutrition routes', () => {
    const routes = getRouteMethodsByPath(router);

    expect(hasRoute(routes, '/status', 'get')).toBe(true);
    expect(hasRoute(routes, '/water', 'post')).toBe(true);
    expect(hasRoute(routes, '/foods', 'get')).toBe(true);
    expect(hasRoute(routes, '/foods', 'post')).toBe(true);
    expect(hasRoute(routes, '/meals', 'get')).toBe(true);
    expect(hasRoute(routes, '/meals', 'post')).toBe(true);
  });

  it.todo('validates bad water input with 400 response');
  it.todo('returns food summary from /foods/summary');
});
