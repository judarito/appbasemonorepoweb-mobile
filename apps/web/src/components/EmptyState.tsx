import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  /** Icono personalizado */
  icon?: ReactNode;
  /** Título del estado vacío */
  title?: string;
  /** Mensaje descriptivo */
  message?: string;
  /** Acción opcional (ej: botón "Crear primero") */
  action?: ReactNode;
}

/**
 * EmptyState — Estado vacío para listados y secciones sin datos.
 */
export function EmptyState({
  icon,
  title = "Sin registros",
  message = "No se encontraron datos para mostrar.",
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || <Inbox size={40} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
