import type { ReactNode } from "react";
import { X } from "lucide-react";

interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

/**
 * AppDialog — Modal reutilizable con header, body y footer.
 *
 * @example
 * <AppDialog open={show} onClose={() => setShow(false)} title="Crear usuario" footer={<button>Guardar</button>}>
 *   <p>Contenido del diálogo...</p>
 * </AppDialog>
 */
export function AppDialog({ open, onClose, title, children, footer, maxWidth = "500px" }: AppDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal animate-fade-in"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} className="btn-close" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
