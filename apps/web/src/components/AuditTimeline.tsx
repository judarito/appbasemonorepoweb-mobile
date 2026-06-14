import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface AuditEntry {
  id: string;
  action: string;
  result: "SUCCESS" | "FAILURE" | "DENIED";
  actorEmail?: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
  ipAddress?: string;
}

interface AuditTimelineProps {
  /** Lista de entradas de auditoría */
  entries: AuditEntry[];
  /** Límite de entradas a mostrar */
  limit?: number;
}

const actionIcon: Record<string, React.ReactNode> = {
  AUTH_LOGIN: <CheckCircle size={16} />,
  AUTH_LOGIN_FAILED: <XCircle size={16} />,
  AUTH_LOGOUT: <Clock size={16} />,
};

const defaultIcon = <AlertTriangle size={16} />;

/**
 * AuditTimeline — Línea de tiempo visual para mostrar eventos de auditoría.
 *
 * @example
 * <AuditTimeline entries={auditLogs} limit={10} />
 */
export function AuditTimeline({ entries, limit }: AuditTimelineProps) {
  const displayEntries = limit ? entries.slice(0, limit) : entries;

  if (entries.length === 0) {
    return (
      <div className="audit-timeline-empty">
        <Clock size={24} />
        <p>No hay eventos de auditoría registrados.</p>
      </div>
    );
  }

  return (
    <div className="audit-timeline">
      {displayEntries.map((entry, idx) => (
        <div key={entry.id} className="audit-timeline-item">
          <div className="audit-timeline-marker">
            <div className={`audit-timeline-dot ${entry.result === "SUCCESS" ? "dot-success" : entry.result === "FAILURE" ? "dot-failure" : "dot-denied"}`}>
              {actionIcon[entry.action] || defaultIcon}
            </div>
            {idx < displayEntries.length - 1 && <div className="audit-timeline-line" />}
          </div>
          <div className="audit-timeline-content">
            <div className="audit-timeline-header">
              <code className="audit-action">{entry.action}</code>
              <StatusBadge status={entry.result} />
            </div>
            <div className="audit-timeline-details">
              <span>{entry.actorEmail || "Sistema"}</span>
              <span className="audit-timeline-sep">·</span>
              <span>{entry.entityType}</span>
              {entry.entityId && (
                <>
                  <span className="audit-timeline-sep">·</span>
                  <code className="audit-timeline-id">{entry.entityId.slice(0, 8)}…</code>
                </>
              )}
            </div>
            <div className="audit-timeline-time">
              {new Date(entry.createdAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
              {entry.ipAddress && ` · ${entry.ipAddress}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
