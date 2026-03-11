import type { Router } from 'express';

interface RouteInfo {
  path: string;
  methods: string[];
}

export function getRouteMethodsByPath(expressRouter: Router): RouteInfo[] {
  return ((expressRouter as any).stack || [])
    .filter((layer: any) => layer.route)
    .map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {})
    }));
}

export function hasRoute(routes: RouteInfo[], path: string, method: string): boolean {
  return routes.some((route) => route.path === path && route.methods.includes(method));
}

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

export async function runRoute(handler: (req: unknown, res: unknown) => unknown, req: Record<string, unknown> = {}) {
  const response = createMockRes();
  await handler(req, response);
  return response;
}
