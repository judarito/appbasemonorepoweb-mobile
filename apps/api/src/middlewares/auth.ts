import type { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { eq, and, isNull } from "drizzle-orm";
import { env } from "../config/env";
import { db } from "../database/db";
import { platformUsers, tenantUsers } from "../database/schema";
import { UnauthorizedError, ForbiddenError } from "../common/errors";

export interface AuthenticatedUser {
  id: string;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
  isSupport?: boolean;
}

export interface AuthenticatedSession {
  id: string;
}

/**
 * Middleware para requerir autenticación mediante JWT Bearer Token.
 * Valida en cada request que:
 * 1. El usuario siga existiendo en la BD
 * 2. El usuario esté ACTIVO
 * 3. El tokenVersion coincida (no hubo renovación forzada)
 * 4. La membresía al tenant siga vigente
 */
export const requireAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Acceso denegado: Token no provisto.");
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, env.JWT_ACCESS_SECRET, "HS256");
    const userId = payload.sub as string;
    const tokenTenantId = payload.tenantId as string | undefined;

    // 1. Validar que el usuario siga existiendo y esté activo en DB
    const user = await db
      .select({
        id: platformUsers.id,
        status: platformUsers.status,
        tokenVersion: platformUsers.tokenVersion,
      })
      .from(platformUsers)
      .where(and(eq(platformUsers.id, userId), isNull(platformUsers.deletedAt)))
      .limit(1)
      .then((r) => r[0]);

    if (!user) {
      throw new UnauthorizedError("Usuario no encontrado.");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError("Cuenta de usuario no activa.");
    }

    // 2. Validar tokenVersion (detección de renovación forzada)
    if (user.tokenVersion !== (payload.tokenVersion as number)) {
      throw new UnauthorizedError("Sesión expirada. Inicia sesión nuevamente.");
    }

    // 3. Validar membresía activa en el tenant (si aplica)
    if (tokenTenantId && tokenTenantId !== "global") {
      const membership = await db
        .select({ id: tenantUsers.id })
        .from(tenantUsers)
        .where(and(
          eq(tenantUsers.userId, userId),
          eq(tenantUsers.tenantId, tokenTenantId),
          eq(tenantUsers.status, "ACTIVE"),
          isNull(tenantUsers.deletedAt),
        ))
        .limit(1)
        .then((r) => r[0]);

      if (!membership) {
        throw new UnauthorizedError("No tienes acceso a este inquilino.");
      }
    }

    // Inyectar el usuario y sesión en el contexto de la petición
    c.set("user", {
      id: userId,
      tenantId: tokenTenantId || null,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      isSupport: !!payload.isSupport,
    });
    
    c.set("session", {
      id: payload.sessionId,
    });

    await next();
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
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
