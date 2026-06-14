import React, { useState, useEffect } from "react";
import { RefreshCw, Activity, Database, Cpu, Clock, Users, SlidersHorizontal } from "lucide-react";
import { api } from "../../lib/api";
import { MetricCard, ProgressBar, StatusDot, formatBytes } from "../../components/MetricCard";

const AUTO_REFRESH_INTERVAL_MS = 5000;

interface ApiMetrics {
  totalRequests: number;
  totalErrors: number;
  averageResponseTimeMs: number;
  requestsByMethod: Record<string, number>;
  requestsByTenant: Record<string, number>;
  statusCodes: Record<string, number>;
}

interface SystemMetrics {
  uptimeSeconds: number;
  memory: { rss: number; heapTotal: number; heapUsed: number };
  cpu: { user: number; system: number };
  databaseLatencyMs: number;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
}

interface MetricsResponse {
  api: ApiMetrics;
  system: SystemMetrics;
}

function LoadingState() {
  return (
    <div className="view-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <RefreshCw size={32} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
        <span style={{ color: "var(--color-muted)" }}>Cargando métricas de observabilidad...</span>
      </div>
    </div>
  );
}

export default function SuperadminTelemetryView() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await api.getRaw<{ success: boolean; data: MetricsResponse }>("/api/v1/metrics");
      setMetrics(res.data);
      setError("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error(msg);
      setError("Error al cargar las métricas en tiempo real.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchMetrics, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !metrics) return <LoadingState />;

  const apiMetrics = metrics?.api || {
    totalRequests: 0, totalErrors: 0, averageResponseTimeMs: 0,
    requestsByMethod: {}, requestsByTenant: {}, statusCodes: {},
  };
  const systemMetrics = metrics?.system || {
    uptimeSeconds: 0, memory: { rss: 0, heapTotal: 0, heapUsed: 0 },
    cpu: { user: 0, system: 0 }, databaseLatencyMs: -1, status: "DOWN" as const,
  };

  const errorRate = apiMetrics.totalRequests > 0
    ? (apiMetrics.totalErrors / apiMetrics.totalRequests) * 100
    : 0;

  return (
    <div className="view-container">
      <div className="view-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="view-title">Métricas & Salud del Sistema</h1>
          <p className="view-subtitle">Monitoreo en tiempo real de recursos, latencias y consumo por inquilino.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} style={{ accentColor: "var(--color-primary)" }} />
            Auto-refrescar (5s)
          </label>
          <button className="btn btn-secondary" onClick={fetchMetrics} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "8px", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fee2e2" }}>
          {error}
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <MetricCard
          title="BASE DE DATOS"
          value={systemMetrics.databaseLatencyMs >= 0 ? `${systemMetrics.databaseLatencyMs} ms` : "Sin Conexión"}
          icon={<Database size={18} />}
        >
          <StatusDot status={systemMetrics.status} />
        </MetricCard>

        <MetricCard
          title="LATENCIA API MEDIA"
          value={`${apiMetrics.averageResponseTimeMs} ms`}
          subtitle="Tiempo medio de ciclo de petición HTTP (v1)"
          icon={<Activity size={18} />}
        />

        <MetricCard
          title="PETICIONES / ERRORES"
          value={`${apiMetrics.totalRequests} / ${apiMetrics.totalErrors} err`}
          icon={<SlidersHorizontal size={18} />}
        >
          <ProgressBar value={errorRate} color="#ef4444" height={6} />
        </MetricCard>

        <MetricCard
          title="TIEMPO DE ACTIVIDAD"
          value={`${Math.floor(systemMetrics.uptimeSeconds / 3600)}h ${Math.floor((systemMetrics.uptimeSeconds % 3600) / 60)}m`}
          subtitle="Uptime del proceso del servidor"
          icon={<Clock size={18} color="#8b5cf6" />}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Cpu size={18} /> Uso de Recursos de Servidor
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                <span>Heap Memory</span>
                <span style={{ color: "var(--color-muted)", fontWeight: 600 }}>
                  {formatBytes(systemMetrics.memory.heapUsed)} / {formatBytes(systemMetrics.memory.heapTotal)}
                </span>
              </div>
              <ProgressBar
                value={systemMetrics.memory.heapTotal > 0 ? (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100 : 0}
                color="var(--color-primary)"
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                <span>RSS (Resident Set Size)</span>
                <span style={{ color: "var(--color-muted)", fontWeight: 600 }}>{formatBytes(systemMetrics.memory.rss)}</span>
              </div>
              <ProgressBar value={Math.min(100, (systemMetrics.memory.rss / (1024 * 1024 * 1024)) * 100)} color="#3b82f6" />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                <span>CPU User / System</span>
                <span style={{ color: "var(--color-muted)", fontWeight: 600 }}>
                  {(systemMetrics.cpu.user / 1000000).toFixed(1)}s / {(systemMetrics.cpu.system / 1000000).toFixed(1)}s
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <ProgressBar value={Math.min(100, systemMetrics.cpu.user / 1000000)} color="#a855f7" height={6} />
                <ProgressBar value={Math.min(100, systemMetrics.cpu.system / 1000000)} color="#e11d48" height={6} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={18} /> Consumo Relativo por Inquilino
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", maxHeight: "180px", flex: 1 }}>
            {Object.entries(apiMetrics.requestsByTenant).length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, color: "var(--color-muted)", fontSize: "0.85rem" }}>
                No hay actividad de peticiones registrada aún.
              </div>
            ) : (
              Object.entries(apiMetrics.requestsByTenant).map(([tenant, count]) => {
                const pct = apiMetrics.totalRequests > 0 ? ((Number(count) / apiMetrics.totalRequests) * 100).toFixed(1) : "0";
                return (
                  <div key={tenant}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                      <span style={{ fontWeight: 600 }}>
                        {tenant === "system_global" ? "Global / Administración" : `Tenant: ${tenant.slice(0, 13)}...`}
                      </span>
                      <span style={{ color: "var(--color-muted)" }}>{String(count)} peticiones ({pct}%)</span>
                    </div>
                    <ProgressBar value={Number(pct)} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Métodos HTTP Utilizados</h3>
          {Object.keys(apiMetrics.requestsByMethod).length === 0 ? (
            <span style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>Esperando tráfico...</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {Object.entries(apiMetrics.requestsByMethod).map(([method, count]) => {
                const colors: Record<string, string> = { GET: "#10b981", POST: "#3b82f6", PUT: "#f59e0b", DELETE: "#ef4444" };
                return (
                  <div key={method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", borderBottom: "1px solid var(--color-bg-alt)", paddingBottom: "0.4rem" }}>
                    <span style={{ fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: "4px", fontSize: "0.75rem", color: "#fff", backgroundColor: colors[method] || "#6b7280" }}>
                      {method}
                    </span>
                    <span style={{ fontWeight: 600 }}>{String(count)} llamadas</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Distribución de Códigos de Estado</h3>
          {Object.keys(apiMetrics.statusCodes).length === 0 ? (
            <span style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>Esperando tráfico...</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {Object.entries(apiMetrics.statusCodes).map(([code, count]) => {
                const c = parseInt(code);
                return (
                  <div key={code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", borderBottom: "1px solid var(--color-bg-alt)", paddingBottom: "0.4rem" }}>
                    <span style={{ fontWeight: 700, color: c >= 500 ? "#ef4444" : c >= 400 ? "#f59e0b" : "#10b981" }}>
                      HTTP {code}
                    </span>
                    <span style={{ fontWeight: 600 }}>{String(count)} veces</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
