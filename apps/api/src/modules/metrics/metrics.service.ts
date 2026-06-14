import { db } from "../../database/db";
import { sql } from "drizzle-orm";

interface ApiMetrics {
  totalRequests: number;
  totalErrors: number;
  requestsByMethod: Record<string, number>;
  requestsByTenant: Record<string, number>;
  statusCodes: Record<number, number>;
  durationsMs: {
    count: number;
    sum: number;
  };
}

class MetricsService {
  private metrics: ApiMetrics = {
    totalRequests: 0,
    totalErrors: 0,
    requestsByMethod: {},
    requestsByTenant: {},
    statusCodes: {},
    durationsMs: {
      count: 0,
      sum: 0,
    },
  };

  recordRequest(method: string, durationMs: number, status: number, tenantId?: string | null) {
    this.metrics.totalRequests++;

    // Métricas por método
    this.metrics.requestsByMethod[method] = (this.metrics.requestsByMethod[method] || 0) + 1;

    // Métricas por estado
    this.metrics.statusCodes[status] = (this.metrics.statusCodes[status] || 0) + 1;
    if (status >= 400) {
      this.metrics.totalErrors++;
    }

    // Métricas por inquilino
    if (tenantId) {
      this.metrics.requestsByTenant[tenantId] = (this.metrics.requestsByTenant[tenantId] || 0) + 1;
    } else {
      this.metrics.requestsByTenant["system_global"] = (this.metrics.requestsByTenant["system_global"] || 0) + 1;
    }

    // Duraciones
    this.metrics.durationsMs.count++;
    this.metrics.durationsMs.sum += durationMs;
  }

  async getMetricsJSON() {
    const memory = process.memoryUsage();
    let dbLatencyMs = -1;

    try {
      const start = performance.now();
      await db.execute(sql`SELECT 1`);
      dbLatencyMs = parseFloat((performance.now() - start).toFixed(2));
    } catch {
      // Ignorar fallo de base de datos para no tumbar métricas
    }

    return {
      success: true,
      data: {
        api: {
          totalRequests: this.metrics.totalRequests,
          totalErrors: this.metrics.totalErrors,
          averageResponseTimeMs: this.metrics.durationsMs.count > 0 
            ? parseFloat((this.metrics.durationsMs.sum / this.metrics.durationsMs.count).toFixed(2))
            : 0,
          requestsByMethod: this.metrics.requestsByMethod,
          requestsByTenant: this.metrics.requestsByTenant,
          statusCodes: this.metrics.statusCodes,
        },
        system: {
          uptimeSeconds: parseFloat(process.uptime().toFixed(0)),
          memory: {
            rss: memory.rss,
            heapTotal: memory.heapTotal,
            heapUsed: memory.heapUsed,
            external: memory.external,
          },
          cpu: process.cpuUsage(),
          databaseLatencyMs: dbLatencyMs,
          status: dbLatencyMs >= 0 ? "HEALTHY" : "DEGRADED",
        }
      }
    };
  }

  async getMetricsPrometheus(): Promise<string> {
    const json = await this.getMetricsJSON();
    const data = json.data;

    let prometheus = "";

    // API Requests Total
    prometheus += "# HELP baseforge_api_requests_total Total number of API requests\n";
    prometheus += "# TYPE baseforge_api_requests_total counter\n";
    prometheus += `baseforge_api_requests_total ${data.api.totalRequests}\n\n`;

    // API Errors Total
    prometheus += "# HELP baseforge_api_errors_total Total number of API errors (status >= 400)\n";
    prometheus += "# TYPE baseforge_api_errors_total counter\n";
    prometheus += `baseforge_api_errors_total ${data.api.totalErrors}\n\n`;

    // Response time average
    prometheus += "# HELP baseforge_api_response_time_average_ms Average response time of API requests\n";
    prometheus += "# TYPE baseforge_api_response_time_average_ms gauge\n";
    prometheus += `baseforge_api_response_time_average_ms ${data.api.averageResponseTimeMs}\n\n`;

    // Requests by tenant
    prometheus += "# HELP baseforge_api_requests_by_tenant_total Request count partitioned by tenant\n";
    prometheus += "# TYPE baseforge_api_requests_by_tenant_total counter\n";
    for (const [tenant, count] of Object.entries(data.api.requestsByTenant)) {
      prometheus += `baseforge_api_requests_by_tenant_total{tenant="${tenant}"} ${count}\n`;
    }
    prometheus += "\n";

    // System metrics
    prometheus += "# HELP baseforge_system_uptime_seconds System uptime in seconds\n";
    prometheus += "# TYPE baseforge_system_uptime_seconds gauge\n";
    prometheus += `baseforge_system_uptime_seconds ${data.system.uptimeSeconds}\n\n`;

    prometheus += "# HELP baseforge_system_memory_rss_bytes Resident Set Size memory usage\n";
    prometheus += "# TYPE baseforge_system_memory_rss_bytes gauge\n";
    prometheus += `baseforge_system_memory_rss_bytes ${data.system.memory.rss}\n\n`;

    prometheus += "# HELP baseforge_system_memory_heap_used_bytes Used Heap memory usage\n";
    prometheus += "# TYPE baseforge_system_memory_heap_used_bytes gauge\n";
    prometheus += `baseforge_system_memory_heap_used_bytes ${data.system.memory.heapUsed}\n\n`;

    // DB Latency
    prometheus += "# HELP baseforge_database_latency_ms Latency of database roundtrip query\n";
    prometheus += "# TYPE baseforge_database_latency_ms gauge\n";
    prometheus += `baseforge_database_latency_ms ${data.system.databaseLatencyMs}\n\n`;

    return prometheus;
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      requestsByMethod: {},
      requestsByTenant: {},
      statusCodes: {},
      durationsMs: {
        count: 0,
        sum: 0,
      },
    };
  }
}

export const metricsService = new MetricsService();
