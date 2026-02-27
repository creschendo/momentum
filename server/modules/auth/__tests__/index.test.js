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

describe('auth router scaffolding', () => {
  it('registers core auth routes', () => {
    const routes = getRouteMethodsByPath(router);

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/register', methods: expect.arrayContaining(['post']) }),
        expect.objectContaining({ path: '/login', methods: expect.arrayContaining(['post']) }),
        expect.objectContaining({ path: '/logout', methods: expect.arrayContaining(['post']) }),
        expect.objectContaining({ path: '/me', methods: expect.arrayContaining(['get']) })
      ])
    );
  });

  it.todo('returns 201 on successful register');
  it.todo('returns 401 for invalid login credentials');
  it.todo('returns 401 on /me without valid session cookie');
});
