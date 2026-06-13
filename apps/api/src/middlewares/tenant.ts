import type { Context, Next } from "hono";
import { db } from "../database/db";
import { tenants, tenantUsers } from "../database/schema";
import { eq, and, isNull } from "drizzle-orm";
import { UnauthorizedError, ForbiddenError } from "../common/errors";
import { logger } from "./logger";

export const tenantContext = async (c: Context, next: Next) => {
  const user = c.get("user" as any);
  if (!user) {
    throw new UnauthorizedError("Acceso denegado: Usuario no autenticado.");
  }

  // 1. Identificar el tenant
  // Por defecto, resolvemos el tenant desde los claims del JWT de acceso
  let tenantId = user.tenantId;

  // Si el usuario es un SUPER_ADMIN, permitimos la suplantación de inquilino mediante la cabecera 'x-tenant-id'
  const impersonatedTenantId = c.req.header("x-tenant-id");
  if (impersonatedTenantId && user.roles.includes("SUPER_ADMIN")) {
    tenantId = impersonatedTenantId;
    c.set("isImpersonated", true);
    logger.info(`[Superadmin Impersonation] Superadministrador ${user.id} está operando sobre el inquilino (tenant) ${tenantId}`);
  }

  // Si no hay tenantId en absoluto (ej. superadmin operando globalmente sin contexto de tenant)
  if (!tenantId) {
    c.set("tenantId", null);
    await next();
    return;
  }

  // 2. Validar existencia y estado del tenant en DB
  const tenant = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)))
    .limit(1)
    .then((res) => res[0]);

  if (!tenant) {
    throw new ForbiddenError("El inquilino (tenant) especificado no existe.");
  }

  if (tenant.status !== "ACTIVE") {
    throw new ForbiddenError("El inquilino (tenant) especificado está inactivo o suspendido.");
  }

  // 3. Validar membresía activa del usuario en el tenant (excepto si es superadmin suplantando o en modo soporte)
  if (!user.roles.includes("SUPER_ADMIN") && !user.isSupport) {
    const membership = await db
      .select()
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.userId, user.id),
          eq(tenantUsers.tenantId, tenantId),
          eq(tenantUsers.status, "ACTIVE"),
          isNull(tenantUsers.deletedAt)
        )
      )
      .limit(1)
      .then((res) => res[0]);

    if (!membership) {
      throw new ForbiddenError("Acceso denegado: No tiene una membresía activa en este inquilino.");
    }
  }

  // 4. Inyectar el tenantId validado en el contexto de la petición
  c.set("tenantId", tenantId);
  await next();
};
