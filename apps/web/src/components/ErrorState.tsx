import { AlertTriangle, RotateCw } from "lucide-react";

interface ErrorStateProps {
  /** Mensaje de error */
  message?: string;
  /** Título del error */
  title?: string;
  /** Callback para reintentar */
  onRetry?: () => void;
  /** Etiqueta del botón reintentar */
  retryLabel?: string;
}

/**
 * ErrorState — Estado de error con opción de reintentar.
 */
export function ErrorState({
  message = "Ocurrió un error inesperado.",
  title = "Error",
  onRetry,
  retryLabel = "Reintentar",
}: ErrorStateProps) {
  return (
    <div className="error-state">
      <div className="error-state-icon">
        <AlertTriangle size={32} />
      </div>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <button className="btn btn-primary btn-sm" onClick={onRetry}>
          <RotateCw size={14} /> {retryLabel}
        </button>
      )}
    </div>
  );
}
