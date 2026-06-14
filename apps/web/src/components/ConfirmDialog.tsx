import type { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  /** Abierto/cerrado */
  open: boolean;
  /** Título del diálogo */
  title?: string;
  /** Mensaje de confirmación */
  message: string | ReactNode;
  /** Etiqueta del botón de confirmar */
  confirmLabel?: string;
  /** Etiqueta del botón de cancelar */
  cancelLabel?: string;
  /** Variante del botón de confirmar */
  variant?: "primary" | "danger";
  /** Icono */
  icon?: ReactNode;
  /** Callback al confirmar */
  onConfirm: () => void;
  /** Callback al cancelar */
  onCancel: () => void;
  /** Cargando */
  loading?: boolean;
}

/**
 * ConfirmDialog — Diálogo de confirmación reutilizable.
 * Útil para acciones destructivas o que requieren doble confirmación.
 */
export function ConfirmDialog({
  open,
  title = "Confirmar acción",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
  icon,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal confirm-dialog animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onCancel} className="btn-close"><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
            {icon || (
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: variant === "danger" ? "rgba(239,68,68,0.1)" : "rgba(124,58,237,0.1)",
                color: variant === "danger" ? "#f87171" : "hsl(var(--primary))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {variant === "danger" ? <AlertTriangle size={24} /> : <AlertTriangle size={24} />}
              </div>
            )}
          </div>
          <div style={{ fontSize: "0.95rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>
            {message}
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: "center", gap: "0.75rem" }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
