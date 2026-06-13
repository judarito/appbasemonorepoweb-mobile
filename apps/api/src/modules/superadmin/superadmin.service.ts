import { SuperadminRepository } from "./superadmin.repository";
import type { CreateTenantInput, UpdateTenantInput, SupportSessionInput } from "./superadmin.schema";
import { ConflictError, NotFoundError, ForbiddenError } from "../../common/errors";
import { sign } from "hono/jwt";
import { env } from "../../config/env";
import { db } from "../../database/db";
import { permissions } from "../../database/schema";

export class SuperadminService {
  private repository = new SuperadminRepository();

  async getTenants(page: number, pageSize: number, search?: string, status?: string, planId?: string) {
    const [items, totalItems] = await Promise.all([
      this.repository.findTenants(page, pageSize, search, status, planId),
      this.repository.countTenants(search, status, planId),
    ]);

    return {
      items,
      totalItems,
    };
  }

  async getTenant(id: string) {
    const tenant = await this.repository.findTenantById(id);
    if (!tenant) {
      throw new NotFoundError(`Tenant con ID '${id}' no encontrado.`);
    }
    return tenant;
  }

  async createTenant(
    data: CreateTenantInput,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string
  ) {
    // 1. Validar duplicados de code o slug
    const duplicates = await this.repository.findByCodeOrSlug(data.code, data.slug);
    if (duplicates.length > 0) {
      throw new ConflictError("El código o slug de tenant ya está registrado.");
    }

    // 2. Hashear contraseña del admin inicial
    const passwordHash = await Bun.password.hash(data.adminPassword);

    // 3. Crear tenant de forma transaccional
    const tenant = await this.repository.createTenantTx(data, passwordHash);

    // 4. Logear auditoría
    await this.repository.logAudit({
      tenantId: tenant.id,
      actorUserId,
      sessionId,
      action: "TENANT_CREATE",
      entityType: "TENANT",
      entityId: tenant.id,
      result: "SUCCESS",
      metadata: { code: tenant.code },
      traceId,
    });

    return tenant;
  }

  async updateTenant(
    id: string,
    data: UpdateTenantInput,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string,
    isSupport?: boolean
  ) {
    if (isSupport) {
      throw new ForbiddenError("Las operaciones de edición y configuración están restringidas en modo soporte.");
    }

    await this.getTenant(id);
    const updated = await this.repository.updateTenant(id, data);

    await this.repository.logAudit({
      tenantId: id,
      actorUserId,
      sessionId,
      action: "TENANT_UPDATE",
      entityType: "TENANT",
      entityId: id,
      result: "SUCCESS",
      metadata: data,
      traceId,
    });

    return updated;
  }

  async updateTenantStatus(
    id: string,
    status: string,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string,
    isSupport?: boolean
  ) {
    if (isSupport) {
      throw new ForbiddenError("Las mutaciones de estado de inquilinos están restringidas en modo soporte.");
    }

    await this.getTenant(id);
    const updated = await this.repository.updateTenantStatus(id, status);

    await this.repository.logAudit({
      tenantId: id,
      actorUserId,
      sessionId,
      action: "TENANT_STATUS_UPDATE",
      entityType: "TENANT",
      entityId: id,
      result: "SUCCESS",
      metadata: { status },
      traceId,
    });

    return updated;
  }

  async getTenantUsers(id: string) {
    await this.getTenant(id);
    return await this.repository.findTenantUsers(id);
  }

  async getTenantUsage(id: string) {
    await this.getTenant(id);
    return await this.repository.findTenantUsage(id);
  }

  async createSupportSession(
    data: SupportSessionInput,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string
  ) {
    // 1. Validar que el tenant existe
    const tenant = await this.repository.findTenantById(data.tenantId);
    if (!tenant) {
      throw new NotFoundError(`Tenant con ID '${data.tenantId}' no encontrado.`);
    }

    // 2. Obtener todos los códigos de permisos permitidos para el tenant admin
    const systemPermissions = await db.select().from(permissions);
    const supportPermissions = systemPermissions
      .filter((p) => p.scope === "TENANT" || p.scope === "BOTH")
      .map((p) => p.code);

    // 3. Generar token firmado temporal
    const exp = Math.floor(Date.now() / 1000) + data.durationMinutes * 60;
    const supportToken = await sign(
      {
        sub: actorUserId,
        tenantId: tenant.id,
        sessionId: sessionId,
        roles: ["TENANT_ADMIN"],
        permissions: supportPermissions,
        isSupport: true,
        exp,
      },
      env.JWT_ACCESS_SECRET,
      "HS256"
    );

    // 4. Logear auditoría crítica del soporte temporal
    await this.repository.logAudit({
      tenantId: tenant.id,
      actorUserId,
      sessionId,
      action: "SUPPORT_MODE_START",
      entityType: "TENANT",
      entityId: tenant.id,
      result: "SUCCESS",
      metadata: { durationMinutes: data.durationMinutes, expiresAt: new Date(exp * 1000).toISOString() },
      traceId,
    });

    return {
      accessToken: supportToken,
      expiresAt: new Date(exp * 1000).toISOString(),
    };
  }
}
