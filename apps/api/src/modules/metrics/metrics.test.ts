import { describe, test, expect, beforeAll } from "bun:test";
import { metricsService } from "./metrics.service";
import { app } from "../../main";

describe("Metrics & Observability Suite", () => {
  beforeAll(() => {
    metricsService.reset();
  });

  test("Debería registrar métricas de API correctamente", async () => {
    metricsService.recordRequest("GET", 12.5, 200, "tenant_1");
    metricsService.recordRequest("POST", 45.2, 201, "tenant_1");
    metricsService.recordRequest("GET", 5.1, 400, "tenant_2");
    metricsService.recordRequest("DELETE", 120.0, 500, null);

    const metrics = await metricsService.getMetricsJSON();
    
    expect(metrics.success).toBe(true);
    expect(metrics.data.api.totalRequests).toBe(4);
    expect(metrics.data.api.totalErrors).toBe(2);
    expect(metrics.data.api.requestsByMethod.GET).toBe(2);
    expect(metrics.data.api.requestsByMethod.POST).toBe(1);
    expect(metrics.data.api.requestsByTenant.tenant_1).toBe(2);
    expect(metrics.data.api.requestsByTenant.tenant_2).toBe(1);
    expect(metrics.data.api.requestsByTenant.system_global).toBe(1);
    expect(metrics.data.api.statusCodes[200]).toBe(1);
    expect(metrics.data.api.statusCodes[500]).toBe(1);
    expect(metrics.data.api.averageResponseTimeMs).toBe(45.7); // (12.5 + 45.2 + 5.1 + 120) / 4 = 182.8 / 4 = 45.7
  });

  test("Debería retornar formato compatible con Prometheus", async () => {
    const body = await metricsService.getMetricsPrometheus();
    
    expect(body).toContain("# HELP baseforge_api_requests_total");
    expect(body).toContain("# TYPE baseforge_api_requests_total");
    expect(body).toContain("baseforge_api_requests_total 4");
    expect(body).toContain("baseforge_api_errors_total 2");
    expect(body).toContain("baseforge_database_latency_ms");
  });

  test("Endpoint /health debería retornar datos de salud y memoria", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("UP");
    expect(json.data.memory.heapUsedBytes).toBeGreaterThan(0);
    expect(json.data.cpu).toBeDefined();
  });

  test("Endpoint /ready debería verificar conexión a base de datos y latencia", async () => {
    const res = await app.request("/ready");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("READY");
    expect(json.data.database).toBe("CONNECTED");
    expect(json.data.databaseLatencyMs).toBeGreaterThanOrEqual(0);
  });

  test("Endpoint /metrics debería retornar formato Prometheus vía HTTP", async () => {
    const res = await app.request("/metrics");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");

    const text = await res.text();
    expect(text).toContain("baseforge_api_requests_total");
  });
});
