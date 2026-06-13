import type { MiddlewareHandler } from "hono";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  } : undefined,
});

export const loggerMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const traceId = c.get("traceId") as string || crypto.randomUUID();
    const { method, url } = c.req;
    const start = performance.now();

    logger.info({
      traceId,
      msg: `[Request] ${method} ${c.req.path}`,
      method,
      url: c.req.path,
    });

    await next();

    const duration = (performance.now() - start).toFixed(2);
    const status = c.res.status;

    logger.info({
      traceId,
      msg: `[Response] ${method} ${c.req.path} - ${status} (${duration}ms)`,
      status,
      duration,
    });
  };
};

export { logger };
