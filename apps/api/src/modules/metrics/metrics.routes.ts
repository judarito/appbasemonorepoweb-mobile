import { Hono } from "hono";
import { metricsService } from "./metrics.service";
import { requireAuth } from "../../middlewares/auth";

const router = new Hono<{ Variables: { traceId: string } }>();

// Endpoint Prometheus (abierto para agentes de raspado como Prometheus/Grafana)
router.get("/metrics", async (c) => {
  const body = await metricsService.getMetricsPrometheus();
  c.header("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  return c.text(body);
});

// Endpoint JSON para Telemetry Dashboard (autenticado)
router.get("/api/v1/metrics", requireAuth, async (c) => {
  const data = await metricsService.getMetricsJSON();
  return c.json(data);
});

export const metricsRoutes = router;
