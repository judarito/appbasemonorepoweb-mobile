import type { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";

interface TenantGuardProps {
  /** ID del tenant requerido (opcional: si no se pasa, solo verifica que exista contexto tenant) */
  tenantId?: string;
  /** Contenido a mostrar si cumple */
  children: ReactNode;
  /** Fallback si no cumple */
  fallback?: ReactNode;
}

/**
 * TenantGuard — Renderiza children solo si el usuario pertenece al tenant indicado
 * o si hay un contexto de tenant activo.
 *
 * @example
 * <TenantGuard tenantId="abc-123">
 *   <p>Contenido exclusivo del tenant</p>
 * </TenantGuard>
 */
export function TenantGuard({ tenantId, children, fallback = null }: TenantGuardProps) {
  const { user, impersonatedTenantId } = useAuthStore();

  // Obtener tenantId desde el token JWT
  const userTenantId = impersonatedTenantId || null;

  if (!tenantId) {
    // Solo verificar que exista contexto tenant
    if (userTenantId) return <>{children}</>;
    return <>{fallback}</>;
  }

  // Verificar tenant específico
  if (userTenantId === tenantId) return <>{children}</>;
  return <>{fallback}</>;
}
