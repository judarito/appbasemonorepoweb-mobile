import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  children?: React.ReactNode;
}

export function MetricCard({ title, value, subtitle, icon, color, children }: MetricCardProps) {
  return (
    <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--color-muted)", fontWeight: 600 }}>{title}</span>
          {icon && <span style={{ color: color || "var(--color-primary)" }}>{icon}</span>}
        </div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.5rem 0" }}>{value}</h2>
      </div>
      {subtitle && <p style={{ fontSize: "0.8rem", color: "var(--color-muted)", margin: "1rem 0 0 0" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color = "var(--color-primary)", height = 8 }: ProgressBarProps) {
  return (
    <div style={{ width: "100%", backgroundColor: "var(--color-bg-alt)", height: `${height}px`, borderRadius: "4px", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: "100%", backgroundColor: color, borderRadius: "4px" }} />
    </div>
  );
}

interface StatusDotProps {
  status: "HEALTHY" | "DEGRADED" | "DOWN";
}

export function StatusDot({ status }: StatusDotProps) {
  const colors = { HEALTHY: "#10b981", DEGRADED: "#f59e0b", DOWN: "#ef4444" };
  const labels = { HEALTHY: "Conexión Óptima", DEGRADED: "Degradado", DOWN: "Fuera de Servicio" };
  const color = colors[status] || "#ef4444";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
      <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, display: "inline-block", boxShadow: `0 0 8px ${color}` }} />
      <span style={{ fontSize: "0.8rem", color: "var(--color-text)", fontWeight: 500 }}>{labels[status]}</span>
    </div>
  );
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
