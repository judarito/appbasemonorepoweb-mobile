import type { MiddlewareHandler } from "hono";

export const traceMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const traceId = crypto.randomUUID();
    c.set("traceId", traceId);
    await next();
    c.header("x-trace-id", traceId);
  };
};
