import { SuperadminRepository } from "./superadmin.repository";
import type { CreateTenantInput, UpdateTenantInput, SupportSessionInput } from "./superadmin.schema";
import type {
  CreatePlanInput,
  UpdatePlanInput,
  CreateFeatureInput,
  UpdateFeatureInput,
  AssociatePlanFeaturesInput,
  OverrideTenantFeaturesInput
} from "./plans.schema";
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

  // --- PLANS SERVICE ---
  async getPlans(page: number, pageSize: number) {
    const [items, totalItems] = await Promise.all([
      this.repository.findPlans(page, pageSize),
      this.repository.countPlans(),
    ]);
    return { items, totalItems };
  }

  async getPlan(id: string) {
    const plan = await this.repository.findPlanById(id);
    if (!plan) {
      throw new NotFoundError(`Plan con ID '${id}' no encontrado.`);
    }
    return plan;
  }

  async createPlan(
    data: CreatePlanInput,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string
  ) {
    const duplicate = await this.repository.findPlanByCode(data.code);
    if (duplicate) {
      throw new ConflictError(`El código de plan '${data.code}' ya está en uso.`);
    }

    const plan = await this.repository.createPlan({
      ...data,
      price: String(data.price),
    });

    await this.repository.logAudit({
      tenantId: null,
      actorUserId,
      sessionId,
      action: "PLAN_CREATE",
      entityType: "PLAN",
      entityId: plan.id,
      result: "SUCCESS",
      metadata: { code: plan.code },
      traceId,
    });

    return plan;
  }

  async updatePlan(
    id: string,
    data: UpdatePlanInput,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string
  ) {
    await this.getPlan(id);

    const payload: any = { ...data };
    if (data.price !== undefined) {
      payload.price = String(data.price);
    }

    const plan = await this.repository.updatePlan(id, payload);

    await this.repository.logAudit({
      tenantId: null,
      actorUserId,
      sessionId,
      action: "PLAN_UPDATE",
      entityType: "PLAN",
      entityId: id,
      result: "SUCCESS",
      metadata: data,
      traceId,
    });

    return plan;
  }

  async deletePlan(
    id: string,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string
  ) {
    await this.getPlan(id);

    const activeSubscriptions = await this.repository.countPlanSubscriptions(id);
    if (activeSubscriptions > 0) {
      throw new ConflictError("No se puede eliminar un plan que tiene suscripciones activas.");
    }

    const plan = await this.repository.deletePlan(id);

    await this.repository.logAudit({
      tenantId: null,
      actorUserId,
      sessionId,
      action: "PLAN_DELETE",
      entityType: "PLAN",
      entityId: id,
      result: "SUCCESS",
      metadata: null,
      traceId,
    });

    return plan;
  }

  // --- FEATURES SERVICE ---
  async getFeatures(page: number, pageSize: number) {
    const [items, totalItems] = await Promise.all([
      this.repository.findFeatures(page, pageSize),
      this.repository.countFeatures(),
    ]);
    return { items, totalItems };
  }

  async getFeature(id: string) {
    const feature = await this.repository.findFeatureById(id);
    if (!feature) {
      throw new NotFoundError(`Característica con ID '${id}' no encontrada.`);
    }
    return feature;
  }

  async createFeature(
    data: CreateFeatureInput,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string
  ) {
    const duplicate = await this.repository.findFeatureByCode(data.code);
    if (duplicate) {
      throw new ConflictError(`El código de característica '${data.code}' ya está registrado.`);
    }

    const feature = await this.repository.createFeature(data);

    await this.repository.logAudit({
      tenantId: null,
      actorUserId,
      sessionId,
      action: "FEATURE_CREATE",
      entityType: "FEATURE",
      entityId: feature.id,
      result: "SUCCESS",
      metadata: { code: feature.code },
      traceId,
    });

    return feature;
  }

  async updateFeature(
    id: string,
    data: UpdateFeatureInput,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string
  ) {
    await this.getFeature(id);
    const feature = await this.repository.updateFeature(id, data);

    await this.repository.logAudit({
      tenantId: null,
      actorUserId,
      sessionId,
      action: "FEATURE_UPDATE",
      entityType: "FEATURE",
      entityId: id,
      result: "SUCCESS",
      metadata: data,
      traceId,
    });

    return feature;
  }

  async deleteFeature(
    id: string,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string
  ) {
    await this.getFeature(id);
    const feature = await this.repository.deleteFeature(id);

    await this.repository.logAudit({
      tenantId: null,
      actorUserId,
      sessionId,
      action: "FEATURE_DELETE",
      entityType: "FEATURE",
      entityId: id,
      result: "SUCCESS",
      metadata: null,
      traceId,
    });

    return feature;
  }

  // --- PLAN FEATURES RELATION ---
  async getPlanFeatures(planId: string) {
    await this.getPlan(planId);
    return await this.repository.findPlanFeatures(planId);
  }

  async savePlanFeatures(
    planId: string,
    data: AssociatePlanFeaturesInput,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string
  ) {
    await this.getPlan(planId);
    await this.repository.savePlanFeaturesTx(planId, data.features);

    await this.repository.logAudit({
      tenantId: null,
      actorUserId,
      sessionId,
      action: "PLAN_FEATURES_UPDATE",
      entityType: "PLAN",
      entityId: planId,
      result: "SUCCESS",
      metadata: { featuresCount: data.features.length },
      traceId,
    });
  }

  // --- TENANT FEATURES OVERRIDES ---
  async getTenantFeatures(tenantId: string) {
    await this.getTenant(tenantId);
    return await this.repository.findTenantFeatures(tenantId);
  }

  async saveTenantFeatures(
    tenantId: string,
    data: OverrideTenantFeaturesInput,
    actorUserId: string,
    sessionId: string | null,
    traceId?: string
  ) {
    await this.getTenant(tenantId);

    const mappedList = data.features.map((f) => ({
      featureId: f.featureId,
      enabled: f.enabled,
      value: f.value,
      validUntil: f.validUntil ? new Date(f.validUntil) : null,
    }));

    await this.repository.saveTenantFeaturesTx(tenantId, mappedList);

    await this.repository.logAudit({
      tenantId,
      actorUserId,
      sessionId,
      action: "TENANT_FEATURES_OVERRIDE",
      entityType: "TENANT",
      entityId: tenantId,
      result: "SUCCESS",
      metadata: { overridesCount: data.features.length },
      traceId,
    });
  }
}

