import type { ReactNode } from "react";

interface AppPageProps {
  /** Título de la página */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Acciones en la cabecera (ej: botón "Crear") */
  actions?: ReactNode;
  /** Contenido principal */
  children: ReactNode;
  /** Clase adicional para el contenedor */
  className?: string;
}

/**
 * AppPage — Envoltura estándar para todas las páginas del admin.
 * Proporciona título, subtítulo, acciones y área de contenido consistente.
 */
export function AppPage({ title, subtitle, actions, children, className }: AppPageProps) {
  return (
    <div className={`view-container${className ? ` ${className}` : ""}`}>
      <div className="app-page-header">
        <div>
          <h1 className="app-page-title">{title}</h1>
          {subtitle && <p className="app-page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="app-page-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
