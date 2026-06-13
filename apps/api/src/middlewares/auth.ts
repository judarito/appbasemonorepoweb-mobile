import type { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { env } from "../config/env";
import { UnauthorizedError, ForbiddenError } from "../common/errors";

export interface AuthenticatedUser {
  id: string;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
}

export interface AuthenticatedSession {
  id: string;
}

/**
 * Middleware para requerir autenticación mediante JWT Bearer Token.
 */
export const requireAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Acceso denegado: Token no provisto.");
  }

  const token = authHeader.substring(7); // Extraer "Bearer "

  try {
    const payload = await verify(token, env.JWT_ACCESS_SECRET, "HS256");
    
    // Inyectar el usuario y sesión en el contexto de la petición
    c.set("user", {
      id: payload.sub,
      tenantId: payload.tenantId,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    });
    
    c.set("session", {
      id: payload.sessionId,
    });

    await next();
  } catch (error) {
    throw new UnauthorizedError("Token de acceso inválido o expirado.");
  }
};

/**
 * Middleware para requerir un permiso específico.
 */
export const requirePermission = (permissionCode: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user" as any) as AuthenticatedUser | undefined;

    if (!user) {
      throw new UnauthorizedError("Acceso denegado: No autenticado.");
    }

    const hasPermission = user.permissions.includes(permissionCode) || user.roles.includes("SUPER_ADMIN");
    if (!hasPermission) {
      throw new ForbiddenError(`Acceso denegado: Se requiere el permiso '${permissionCode}'.`);
    }

    await next();
  };
};

/**
 * Middleware para requerir un rol específico.
 */
export const requireRole = (roleCode: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user" as any) as AuthenticatedUser | undefined;

    if (!user) {
      throw new UnauthorizedError("Acceso denegado: No autenticado.");
    }

    const hasRole = user.roles.includes(roleCode) || user.roles.includes("SUPER_ADMIN");
    if (!hasRole) {
      throw new ForbiddenError(`Acceso denegado: Se requiere el rol '${roleCode}'.`);
    }

    await next();
  };
};
