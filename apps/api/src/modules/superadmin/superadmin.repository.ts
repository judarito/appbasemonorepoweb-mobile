import { db } from "../../database/db";
import {
  tenants,
  tenantUsers,
  platformUsers,
  roles,
  rolePermissions,
  userRoles,
  permissions,
  subscriptions,
  plans,
  features,
  tenantFeatures,
  planFeatures,
  tenantSettings,
  tenantUsage,
  auditLogs,
  menus,
  roleMenus
} from "../../database/schema";
import { eq, and, isNull, sql, or, ilike, count, gte, lte } from "drizzle-orm";
import type { CreateTenantInput, UpdateTenantInput } from "./superadmin.schema";
import { auditService } from "../../common/audit.service";

export class SuperadminRepository {
  async findTenants(page: number, pageSize: number, search?: string, status?: string, planId?: string) {
    const conditions: any[] = [isNull(tenants.deletedAt)];

    if (status) {
      conditions.push(eq(tenants.status, status));
    }

    if (search) {
      conditions.push(
        or(
          ilike(tenants.code, `%${search}%`),
          ilike(tenants.displayName, `%${search}%`),
          ilike(tenants.legalName, `%${search}%`)
        )
      );
    }

    let query = db
      .select({
        id: tenants.id,
        code: tenants.code,
        slug: tenants.slug,
        legalName: tenants.legalName,
        displayName: tenants.displayName,
        taxId: tenants.taxId,
        countryCode: tenants.countryCode,
        currencyCode: tenants.currencyCode,
        timezone: tenants.timezone,
        locale: tenants.locale,
        status: tenants.status,
        logoUrl: tenants.logoUrl,
        primaryColor: tenants.primaryColor,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants);

    if (planId) {
      // Unir con subscriptions activos
      query = query.innerJoin(
        subscriptions,
        and(
          eq(subscriptions.tenantId, tenants.id),
          eq(subscriptions.planId, planId),
          isNull(subscriptions.deletedAt)
        )
      ) as any;
    }

    const offset = (page - 1) * pageSize;

    return await query
      .where(and(...conditions))
      .orderBy(tenants.createdAt)
      .limit(pageSize)
      .offset(offset);
  }

  async countTenants(search?: string, status?: string, planId?: string): Promise<number> {
    const conditions: any[] = [isNull(tenants.deletedAt)];

    if (status) {
      conditions.push(eq(tenants.status, status));
    }

    if (search) {
      conditions.push(
        or(
          ilike(tenants.code, `%${search}%`),
          ilike(tenants.displayName, `%${search}%`),
          ilike(tenants.legalName, `%${search}%`)
        )
      );
    }

    let query: any = db.select({ value: count() }).from(tenants);

    if (planId) {
      query = query.innerJoin(
        subscriptions,
        and(
          eq(subscriptions.tenantId, tenants.id),
          eq(subscriptions.planId, planId),
          isNull(subscriptions.deletedAt)
        )
      ) as any;
    }

    const res = await query.where(and(...conditions));
    return Number(res[0]?.value || 0);
  }

  async findTenantById(id: string) {
    const results = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, id), isNull(tenants.deletedAt)))
      .limit(1);

    return results[0] || null;
  }

  async findByCodeOrSlug(code: string, slug: string) {
    const results = await db
      .select()
      .from(tenants)
      .where(
        and(
          isNull(tenants.deletedAt),
          or(eq(tenants.code, code), eq(tenants.slug, slug))
        )
      );
    return results;
  }

  async createTenantTx(data: CreateTenantInput, passwordHash: string) {
    return await db.transaction(async (tx) => {
      // 1. Obtener información del plan seleccionado
      const [plan] = await tx
        .select()
        .from(plans)
        .where(and(eq(plans.id, data.planId), isNull(plans.deletedAt)))
        .limit(1);

      if (!plan) {
        throw new Error(`El plan con ID '${data.planId}' no existe.`);
      }

      // 2. Insertar Tenant
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          code: data.code,
          slug: data.slug,
          displayName: data.displayName,
          legalName: data.legalName || null,
          taxId: data.taxId || null,
          countryCode: data.countryCode,
          currencyCode: data.currencyCode,
          timezone: data.timezone,
          locale: data.locale,
          status: "ACTIVE",
        })
        .returning();

      // 3. Crear roles iniciales del tenant
      const [tenantAdminRole] = await tx
        .insert(roles)
        .values({
          tenantId: newTenant.id,
          code: "TENANT_ADMIN",
          name: "Administrador del tenant",
          description: "Administra usuarios, roles, configuración y módulos del tenant.",
          scope: "TENANT",
          isSystem: true,
          isDefault: false,
        })
        .returning();

      const [tenantUserRole] = await tx
        .insert(roles)
        .values({
          tenantId: newTenant.id,
          code: "TENANT_USER",
          name: "Usuario estándar",
          description: "Usuario básico del tenant con acceso a módulos asignados.",
          scope: "TENANT",
          isSystem: true,
          isDefault: true,
        })
        .returning();

      // Asociar todos los menús globales de la plataforma al rol TENANT_ADMIN por defecto
      const globalMenus = await tx
        .select({ id: menus.id })
        .from(menus)
        .where(and(isNull(menus.tenantId), isNull(menus.deletedAt)));

      if (globalMenus.length > 0) {
        await tx.insert(roleMenus).values(
          globalMenus.map((m) => ({
            roleId: tenantAdminRole.id,
            menuId: m.id,
            isVisible: true,
          }))
        );
      }

      // 4. Mapear permisos a roles del nuevo tenant
      // Obtener todos los permisos del sistema
      const systemPermissions = await tx.select().from(permissions);

      // Cargar permisos para TENANT_ADMIN (alcance TENANT o BOTH)
      const adminPerms = systemPermissions.filter((p) => p.scope === "TENANT" || p.scope === "BOTH");
      if (adminPerms.length > 0) {
        await tx.insert(rolePermissions).values(
          adminPerms.map((p) => ({
            roleId: tenantAdminRole.id,
            permissionId: p.id,
          }))
        );
      }

      // Cargar permisos básicos para TENANT_USER
      const userPermsCodes = [
        "dashboard.read",
        "profile.read",
        "profile.update",
        "notifications.read",
        "notifications.update",
      ];
      const userPerms = systemPermissions.filter((p) => userPermsCodes.includes(p.code));
      if (userPerms.length > 0) {
        await tx.insert(rolePermissions).values(
          userPerms.map((p) => ({
            roleId: tenantUserRole.id,
            permissionId: p.id,
          }))
        );
      }

      // 5. Crear la Suscripción inicial al Plan
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30); // 30 días de vigencia

      await tx.insert(subscriptions).values({
        tenantId: newTenant.id,
        planId: plan.id,
        status: "ACTIVE",
        billingCycle: plan.billingCycle,
        quantity: 1,
        currencyCode: plan.currencyCode,
        unitPrice: plan.price,
        startsAt: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        autoRenew: true,
      });

      // 6. Crear o mapear el Usuario de Plataforma Administrador
      let adminUser = await tx
        .select()
        .from(platformUsers)
        .where(and(eq(platformUsers.email, data.adminEmail.toLowerCase()), isNull(platformUsers.deletedAt)))
        .limit(1)
        .then((res) => res[0]);

      if (!adminUser) {
        // Crear nuevo usuario
        [adminUser] = await tx
          .insert(platformUsers)
          .values({
            email: data.adminEmail.toLowerCase(),
            passwordHash,
            firstName: "Administrador",
            lastName: "Inicial",
            displayName: "Administrador Inicial",
            status: "ACTIVE",
          })
          .returning();
      }

      // 7. Asociar el usuario al nuevo tenant como miembro activo
      await tx.insert(tenantUsers).values({
        tenantId: newTenant.id,
        userId: adminUser.id,
        status: "ACTIVE",
      });

      // 8. Asignar el rol de administrador del tenant al usuario
      await tx.insert(userRoles).values({
        userId: adminUser.id,
        tenantId: newTenant.id,
        roleId: tenantAdminRole.id,
      });

      // 9. Crear configuraciones por defecto del tenant
      await tx.insert(tenantSettings).values([
        {
          tenantId: newTenant.id,
          key: "language",
          groupName: "general",
          value: "es-CO",
          valueType: "STRING",
          isPublic: true,
        },
        {
          tenantId: newTenant.id,
          key: "timezone",
          groupName: "general",
          value: "America/Bogota",
          valueType: "STRING",
          isPublic: true,
        },
      ]);

      return newTenant;
    });
  }

  async updateTenant(id: string, data: UpdateTenantInput) {
    const [updated] = await db
      .update(tenants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return updated;
  }

  async updateTenantStatus(id: string, status: string) {
    const [updated] = await db
      .update(tenants)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return updated;
  }

  async findTenantUsers(tenantId: string) {
    return await db
      .select({
        id: platformUsers.id,
        email: platformUsers.email,
        firstName: platformUsers.firstName,
        lastName: platformUsers.lastName,
        displayName: platformUsers.displayName,
        status: tenantUsers.status,
        joinedAt: tenantUsers.createdAt,
      })
      .from(tenantUsers)
      .innerJoin(platformUsers, eq(tenantUsers.userId, platformUsers.id))
      .where(and(eq(tenantUsers.tenantId, tenantId), isNull(tenantUsers.deletedAt)));
  }

  async findTenantUsage(tenantId: string) {
    return await db
      .select()
      .from(tenantUsage)
      .where(eq(tenantUsage.tenantId, tenantId))
      .orderBy(tenantUsage.periodEnd);
  }

  async logAudit(data: {
    tenantId: string | null;
    actorUserId: string;
    sessionId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    result: "SUCCESS" | "FAILURE" | "DENIED";
    metadata?: any;
    traceId?: string;
  }) {
    // Delegar al servicio centralizado con enmascarado automático
    await auditService.logSync({
      tenantId: data.tenantId,
      actorUserId: data.actorUserId,
      sessionId: data.sessionId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      result: data.result,
      metadata: data.metadata,
      traceId: data.traceId,
    });
  }

  // --- PLANS CRUD ---
  async findPlans(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    return await db
      .select()
      .from(plans)
      .where(isNull(plans.deletedAt))
      .orderBy(plans.sortOrder)
      .limit(pageSize)
      .offset(offset);
  }

  async countPlans(): Promise<number> {
    const res = await db
      .select({ value: count() })
      .from(plans)
      .where(isNull(plans.deletedAt));
    return Number(res[0]?.value || 0);
  }

  async findPlanById(id: string) {
    const res = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, id), isNull(plans.deletedAt)))
      .limit(1);
    return res[0] || null;
  }

  async findPlanByCode(code: string) {
    const res = await db
      .select()
      .from(plans)
      .where(and(eq(plans.code, code), isNull(plans.deletedAt)))
      .limit(1);
    return res[0] || null;
  }

  async createPlan(data: any) {
    const [inserted] = await db.insert(plans).values(data).returning();
    return inserted;
  }

  async updatePlan(id: string, data: any) {
    const [updated] = await db
      .update(plans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return updated;
  }

  async deletePlan(id: string) {
    const [deleted] = await db
      .update(plans)
      .set({ deletedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return deleted;
  }

  async countPlanSubscriptions(planId: string): Promise<number> {
    const res = await db
      .select({ value: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.planId, planId),
          isNull(subscriptions.deletedAt),
          or(
            eq(subscriptions.status, "ACTIVE"),
            eq(subscriptions.status, "TRIALING"),
            eq(subscriptions.status, "GRACE_PERIOD")
          )
        )
      );
    return Number(res[0]?.value || 0);
  }

  // --- FEATURES CRUD ---
  async findFeatures(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    return await db
      .select()
      .from(features)
      .orderBy(features.code)
      .limit(pageSize)
      .offset(offset);
  }

  async countFeatures(): Promise<number> {
    const res = await db.select({ value: count() }).from(features);
    return Number(res[0]?.value || 0);
  }

  async findFeatureById(id: string) {
    const res = await db.select().from(features).where(eq(features.id, id)).limit(1);
    return res[0] || null;
  }

  async findFeatureByCode(code: string) {
    const res = await db.select().from(features).where(eq(features.code, code)).limit(1);
    return res[0] || null;
  }

  async createFeature(data: any) {
    const [inserted] = await db.insert(features).values(data).returning();
    return inserted;
  }

  async updateFeature(id: string, data: any) {
    const [updated] = await db
      .update(features)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(features.id, id))
      .returning();
    return updated;
  }

  async deleteFeature(id: string) {
    const [deleted] = await db.delete(features).where(eq(features.id, id)).returning();
    return deleted;
  }

  // --- PLAN FEATURES RELATION ---
  async findPlanFeatures(planId: string) {
    return await db
      .select({
        featureId: features.id,
        code: features.code,
        name: features.name,
        valueType: features.valueType,
        defaultValue: features.defaultValue,
        enabled: planFeatures.enabled,
        value: planFeatures.value,
      })
      .from(planFeatures)
      .innerJoin(features, eq(planFeatures.featureId, features.id))
      .where(eq(planFeatures.planId, planId));
  }

  async savePlanFeaturesTx(planId: string, featuresList: { featureId: string; enabled: boolean; value?: any }[]) {
    return await db.transaction(async (tx) => {
      await tx.delete(planFeatures).where(eq(planFeatures.planId, planId));

      if (featuresList.length > 0) {
        await tx.insert(planFeatures).values(
          featuresList.map((f) => ({
            planId,
            featureId: f.featureId,
            enabled: f.enabled,
            value: f.value || null,
          }))
        );
      }
    });
  }

  // --- TENANT FEATURES OVERRIDES ---
  async findTenantFeatures(tenantId: string) {
    return await db
      .select({
        featureId: features.id,
        code: features.code,
        name: features.name,
        valueType: features.valueType,
        defaultValue: features.defaultValue,
        enabled: tenantFeatures.enabled,
        value: tenantFeatures.value,
        validUntil: tenantFeatures.validUntil,
      })
      .from(tenantFeatures)
      .innerJoin(features, eq(tenantFeatures.featureId, features.id))
      .where(eq(tenantFeatures.tenantId, tenantId));
  }

  async saveTenantFeaturesTx(
    tenantId: string,
    featuresList: { featureId: string; enabled: boolean; value?: any; validUntil?: Date | null }[]
  ) {
    return await db.transaction(async (tx) => {
      await tx.delete(tenantFeatures).where(eq(tenantFeatures.tenantId, tenantId));

      if (featuresList.length > 0) {
        await tx.insert(tenantFeatures).values(
          featuresList.map((f) => ({
            tenantId,
            featureId: f.featureId,
            enabled: f.enabled,
            value: f.value || null,
            validUntil: f.validUntil || null,
          }))
        );
      }
    });
  }

  async findAuditLogs(
    page: number,
    pageSize: number,
    filters: {
      tenantId?: string;
      action?: string;
      result?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    const offset = (page - 1) * pageSize;
    const conditions: any[] = [];

    if (filters.tenantId) {
      conditions.push(eq(auditLogs.tenantId, filters.tenantId));
    }
    if (filters.action) {
      conditions.push(ilike(auditLogs.action, `%${filters.action}%`));
    }
    if (filters.result) {
      conditions.push(eq(auditLogs.result, filters.result));
    }
    if (filters.dateFrom) {
      conditions.push(gte(auditLogs.occurredAt, new Date(filters.dateFrom)));
    }
    if (filters.dateTo) {
      conditions.push(lte(auditLogs.occurredAt, new Date(filters.dateTo)));
    }

    return await db
      .select({
        id: auditLogs.id,
        tenantId: auditLogs.tenantId,
        actorUserId: auditLogs.actorUserId,
        actorEmail: platformUsers.email,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        result: auditLogs.result,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.occurredAt,
      })
      .from(auditLogs)
      .leftJoin(platformUsers, eq(auditLogs.actorUserId, platformUsers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${auditLogs.occurredAt} DESC`)
      .limit(pageSize)
      .offset(offset);
  }

  async countAuditLogs(
    filters: {
      tenantId?: string;
      action?: string;
      result?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<number> {
    const conditions: any[] = [];

    if (filters.tenantId) conditions.push(eq(auditLogs.tenantId, filters.tenantId));
    if (filters.action) conditions.push(ilike(auditLogs.action, `%${filters.action}%`));
    if (filters.result) conditions.push(eq(auditLogs.result, filters.result));
    if (filters.dateFrom) conditions.push(gte(auditLogs.occurredAt, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(auditLogs.occurredAt, new Date(filters.dateTo)));

    const res = await db
      .select({ value: count() })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return Number(res[0]?.value || 0);
  }
}

