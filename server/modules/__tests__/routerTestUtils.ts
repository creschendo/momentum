import type { Router } from 'express';

interface RouteInfo {
  path: string;
  methods: string[];
}

/** Extracts all registered routes from an Express Router's internal stack
 *  and returns them as an array of { path, methods[] } objects. Used in
 *  tests to verify that expected endpoints are registered. */
export function getRouteMethodsByPath(expressRouter: Router): RouteInfo[] {
  return ((expressRouter as any).stack || [])
    .filter((layer: any) => layer.route)
    .map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {})
    }));
}

/** Returns true if the given routes array contains an entry matching both
 *  the specified path and HTTP method (case-sensitive). */
export function hasRoute(routes: RouteInfo[], path: string, method: string): boolean {
  return routes.some((route) => route.path === path && route.methods.includes(method));
}

/** Locates and returns the last handler function registered for the given
 *  HTTP method and path on an Express Router. Throws if no matching route
 *  is found, making test failures explicit. */
export function getRouteHandler(expressRouter: Router, method: string, path: string) {
  const layer = ((expressRouter as any).stack || []).find(
    (candidate: any) =>
      candidate.route &&
      candidate.route.path === path &&
      candidate.route.methods &&
      candidate.route.methods[method.toLowerCase()]
  );

  if (!layer) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle;
}

/** Creates a minimal mock Express response object with chainable status(),
 *  json(), end(), cookie(), and clearCookie() methods. Captures all calls
 *  on the returned object so tests can assert on statusCode, body, and
 *  cookie interactions without a real HTTP connection. */
export function createMockRes() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    cookieCalls: [] as { name: string; value: string; options: unknown }[],
    clearCookieCalls: [] as { name: string; options: unknown }[],
    ended: false,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
    cookie(name: string, value: string, options: unknown) {
      this.cookieCalls.push({ name, value, options });
      return this;
    },
    clearCookie(name: string, options: unknown) {
      this.clearCookieCalls.push({ name, options });
      return this;
    }
  };
}

const mockLog = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
};

/** Executes a route handler with a mock response and the provided mock
 *  request, then returns the populated mock response for assertion.
 *  Simplifies testing individual route handlers without spinning up a server. */
export async function runRoute(handler: (req: unknown, res: unknown) => unknown, req: Record<string, unknown> = {}) {
  const response = createMockRes();
  await handler({ log: mockLog, query: {}, ...req }, response);
  return response;
}
