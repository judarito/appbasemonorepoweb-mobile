import type { ReactNode } from "react";

interface FeatureGuardProps {
  /** Código de la feature requerida */
  featureCode: string;
  /** Contenido si la feature está habilitada */
  children: ReactNode;
  /** Fallback si la feature no está disponible */
  fallback?: ReactNode;
}

/**
 * FeatureGuard — Renderiza children solo si la feature está habilitada.
 * NOTA: La verificación de features se delega completamente al backend.
 * Este componente es un wrapper visual que debe recibir la información
 * desde el contexto de permisos/features del usuario.
 *
 * @example
 * <FeatureGuard featureCode="realtime_chat">
 *   <ChatWidget />
 * </FeatureGuard>
 */
export function FeatureGuard({ children, fallback = null }: FeatureGuardProps) {
  // TODO: Integrar con el endpoint GET /me/context para verificar features
  // Por ahora, renderiza children (optimista). La API debe rechazar
  // cualquier acción si la feature no está habilitada.
  return <>{children}</>;
}
