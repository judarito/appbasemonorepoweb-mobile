import type { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";

interface PermissionGuardProps {
  /** Permiso requerido */
  permission: string;
  /** Contenido a mostrar si tiene permiso */
  children: ReactNode;
  /** Fallback opcional si no tiene permiso */
  fallback?: ReactNode;
}

/**
 * PermissionGuard — Renderiza children solo si el usuario tiene el permiso indicado.
 * Útil para ocultar botones, secciones o componentes según el rol.
 *
 * @example
 * <PermissionGuard permission="users.create">
 *   <button>Crear Usuario</button>
 * </PermissionGuard>
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { user } = useAuthStore();
  const hasPermission = user?.permissions?.includes(permission) ?? false;

  if (hasPermission) return <>{children}</>;
  return <>{fallback}</>;
}
