import type { Context } from "hono";
import { SuperadminService } from "./superadmin.service";
import {
  createTenantSchema,
  updateTenantSchema,
  tenantStatusSchema,
  supportSessionSchema
} from "./superadmin.schema";
import {
  createPlanSchema,
  updatePlanSchema,
  createFeatureSchema,
  updateFeatureSchema,
  associatePlanFeaturesSchema,
  overrideTenantFeaturesSchema
} from "./plans.schema";
import { ValidationError } from "../../common/errors";


export class SuperadminController {
  private service = new SuperadminService();

  getTenants = async (c: Context) => {
    const page = Number(c.req.query("page") || 1);
    const pageSize = Number(c.req.query("pageSize") || 10);
    const search = c.req.query("search");
    const status = c.req.query("status");
    const planId = c.req.query("planId");

    const result = await this.service.getTenants(page, pageSize, search, status, planId);

    return c.json({
      success: true,
      data: result,
      meta: {
        page,
        pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / pageSize),
      },
      traceId: c.get("traceId" as any),
    });
  };

  getTenant = async (c: Context) => {
    const id = c.req.param("id")!;
    const tenant = await this.service.getTenant(id);

    return c.json({
      success: true,
      data: tenant,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  createTenant = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const body = await c.req.json().catch(() => ({}));

    const parsed = createTenantSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const tenant = await this.service.createTenant(
      parsed.data,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any)
    );

    return c.json({
      success: true,
      data: tenant,
      meta: null,
      traceId: c.get("traceId" as any),
    }, 201);
  };

  updateTenant = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const id = c.req.param("id")!;
    const body = await c.req.json().catch(() => ({}));

    const parsed = updateTenantSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const tenant = await this.service.updateTenant(
      id,
      parsed.data,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any),
      actorUser.isSupport
    );

    return c.json({
      success: true,
      data: tenant,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  updateTenantStatus = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const id = c.req.param("id")!;
    const body = await c.req.json().catch(() => ({}));

    const parsed = tenantStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const tenant = await this.service.updateTenantStatus(
      id,
      parsed.data.status,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any),
      actorUser.isSupport
    );

    return c.json({
      success: true,
      data: tenant,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  getTenantUsers = async (c: Context) => {
    const id = c.req.param("id")!;
    const users = await this.service.getTenantUsers(id);

    return c.json({
      success: true,
      data: {
        items: users,
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  getTenantUsage = async (c: Context) => {
    const id = c.req.param("id")!;
    const usage = await this.service.getTenantUsage(id);

    return c.json({
      success: true,
      data: {
        items: usage,
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  createSupportSession = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const body = await c.req.json().catch(() => ({}));

    const parsed = supportSessionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const result = await this.service.createSupportSession(
      parsed.data,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any)
    );

    return c.json({
      success: true,
      data: result,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  // --- PLANS CONTROLLER ---
  getPlans = async (c: Context) => {
    const page = Number(c.req.query("page") || 1);
    const pageSize = Number(c.req.query("pageSize") || 10);
    const result = await this.service.getPlans(page, pageSize);

    return c.json({
      success: true,
      data: result,
      meta: {
        page,
        pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / pageSize),
      },
      traceId: c.get("traceId" as any),
    });
  };

  getPlan = async (c: Context) => {
    const id = c.req.param("id")!;
    const plan = await this.service.getPlan(id);

    return c.json({
      success: true,
      data: plan,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  createPlan = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const body = await c.req.json().catch(() => ({}));

    const parsed = createPlanSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const plan = await this.service.createPlan(
      parsed.data,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any)
    );

    return c.json({
      success: true,
      data: plan,
      meta: null,
      traceId: c.get("traceId" as any),
    }, 201);
  };

  updatePlan = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const id = c.req.param("id")!;
    const body = await c.req.json().catch(() => ({}));

    const parsed = updatePlanSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const plan = await this.service.updatePlan(
      id,
      parsed.data,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any)
    );

    return c.json({
      success: true,
      data: plan,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  deletePlan = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const id = c.req.param("id")!;

    await this.service.deletePlan(
      id,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any)
    );

    return c.json({
      success: true,
      data: null,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  // --- FEATURES CONTROLLER ---
  getFeatures = async (c: Context) => {
    const page = Number(c.req.query("page") || 1);
    const pageSize = Number(c.req.query("pageSize") || 10);
    const result = await this.service.getFeatures(page, pageSize);

    return c.json({
      success: true,
      data: result,
      meta: {
        page,
        pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / pageSize),
      },
      traceId: c.get("traceId" as any),
    });
  };

  getFeature = async (c: Context) => {
    const id = c.req.param("id")!;
    const feature = await this.service.getFeature(id);

    return c.json({
      success: true,
      data: feature,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  createFeature = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const body = await c.req.json().catch(() => ({}));

    const parsed = createFeatureSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const feature = await this.service.createFeature(
      parsed.data,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any)
    );

    return c.json({
      success: true,
      data: feature,
      meta: null,
      traceId: c.get("traceId" as any),
    }, 201);
  };

  updateFeature = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const id = c.req.param("id")!;
    const body = await c.req.json().catch(() => ({}));

    const parsed = updateFeatureSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const feature = await this.service.updateFeature(
      id,
      parsed.data,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any)
    );

    return c.json({
      success: true,
      data: feature,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  deleteFeature = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const id = c.req.param("id")!;

    await this.service.deleteFeature(
      id,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any)
    );

    return c.json({
      success: true,
      data: null,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  // --- PLAN FEATURES RELATION ---
  getPlanFeatures = async (c: Context) => {
    const planId = c.req.param("id")!;
    const list = await this.service.getPlanFeatures(planId);

    return c.json({
      success: true,
      data: {
        items: list,
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  savePlanFeatures = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const planId = c.req.param("id")!;
    const body = await c.req.json().catch(() => ({}));

    const parsed = associatePlanFeaturesSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    await this.service.savePlanFeatures(
      planId,
      parsed.data,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any)
    );

    return c.json({
      success: true,
      data: null,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  // --- TENANT FEATURES OVERRIDES ---
  getTenantFeatures = async (c: Context) => {
    const tenantId = c.req.param("id")!;
    const list = await this.service.getTenantFeatures(tenantId);

    return c.json({
      success: true,
      data: {
        items: list,
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  saveTenantFeatures = async (c: Context) => {
    const actorUser = c.get("user" as any);
    const session = c.get("session" as any);
    const tenantId = c.req.param("id")!;
    const body = await c.req.json().catch(() => ({}));

    const parsed = overrideTenantFeaturesSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    await this.service.saveTenantFeatures(
      tenantId,
      parsed.data,
      actorUser.id,
      session ? session.id : null,
      c.get("traceId" as any)
    );

    return c.json({
      success: true,
      data: null,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  getAuditLogs = async (c: Context) => {
    const page = Number(c.req.query("page") || 1);
    const pageSize = Number(c.req.query("pageSize") || 20);

    const filters = {
      tenantId: c.req.query("tenantId") || undefined,
      action: c.req.query("action") || undefined,
      result: c.req.query("result") || undefined,
      dateFrom: c.req.query("dateFrom") || undefined,
      dateTo: c.req.query("dateTo") || undefined,
    };

    const result = await this.service.getAuditLogs(page, pageSize, filters);

    return c.json({
      success: true,
      data: result,
      meta: {
        page,
        pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / pageSize),
        filters,
      },
      traceId: c.get("traceId" as any),
    });
  };

  getPermissions = async (c: Context) => {
    const items = await this.service.getPermissions();
    return c.json({
      success: true,
      data: {
        items,
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };
}

