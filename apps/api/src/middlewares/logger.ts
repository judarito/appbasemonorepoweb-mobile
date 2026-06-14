import type { MiddlewareHandler, Context } from "hono";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.body.password",
      "req.body.clientSecret",
      "password",
      "passwordHash",
      "secret",
      "token",
      "refreshToken",
      "authorization",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.secret"
    ],
    censor: "***"
  },
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
    const tenantId = c.get("tenantId") as string | null;

    logger.info({
      traceId,
      tenantId: tenantId || undefined,
      msg: `[Response] ${method} ${c.req.path} - ${status} (${duration}ms)`,
      status,
      duration,
    });
  };
};

export const getCtxLogger = (c: Context) => {
  const traceId = c.get("traceId") as string | undefined;
  const tenantId = c.get("tenantId") as string | undefined;
  return logger.child({
    traceId,
    tenantId: tenantId || undefined,
  });
};

export { logger };
