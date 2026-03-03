export function getRouteMethodsByPath(expressRouter) {
  return (expressRouter.stack || [])
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {})
    }));
}

export function hasRoute(routes, path, method) {
  return routes.some((route) => route.path === path && route.methods.includes(method));
}

export function getRouteHandler(expressRouter, method, path) {
  const layer = (expressRouter.stack || []).find(
    (candidate) =>
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
    body: undefined,
    cookieCalls: [],
    clearCookieCalls: [],
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
    cookie(name, value, options) {
      this.cookieCalls.push({ name, value, options });
      return this;
    },
    clearCookie(name, options) {
      this.clearCookieCalls.push({ name, options });
      return this;
    }
  };
}

export async function runRoute(handler, req = {}) {
  const response = createMockRes();
  await handler(req, response);
  return response;
}