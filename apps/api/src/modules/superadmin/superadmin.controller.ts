import type { Context } from "hono";
import { SuperadminService } from "./superadmin.service";
import {
  createTenantSchema,
  updateTenantSchema,
  tenantStatusSchema,
  supportSessionSchema
} from "./superadmin.schema";
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
}
