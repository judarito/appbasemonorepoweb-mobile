import type { MiddlewareHandler } from "hono";
import { metricsService } from "../modules/metrics/metrics.service";

export const metricsMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    // Evitar contar llamadas de salud o las propias métricas en estadísticas operacionales principales
    const isOperationalRoute = c.req.path.startsWith("/api/v1/");

    const start = performance.now();
    await next();
    
    if (isOperationalRoute) {
      const durationMs = performance.now() - start;
      const tenantId = c.get("tenantId") as string | null;
      const { method } = c.req;
      const status = c.res.status;

      metricsService.recordRequest(method, durationMs, status, tenantId);
    }
  };
};
