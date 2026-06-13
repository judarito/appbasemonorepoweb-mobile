import type { Context } from "hono";
import { RolesService } from "./roles.service";
import { parsePaginationParams, buildPaginationMeta } from "../../common/utils/query";
import { createRoleSchema, updateRoleSchema } from "./roles.schema";
import { ValidationError } from "../../common/errors";

export class RolesController {
  private service = new RolesService();

  getRoles = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const { page, pageSize } = parsePaginationParams(c);
    const { items, totalItems } = await this.service.getRoles(tenantId, page, pageSize);

    return c.json({
      success: true,
      data: {
        items,
      },
      meta: buildPaginationMeta(page, pageSize, totalItems),
      traceId: c.get("traceId" as any),
    });
  };

  getRole = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const role = await this.service.getRole(id, tenantId);

    return c.json({
      success: true,
      data: role,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  createRole = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const body = await c.req.json().catch(() => ({}));

    const parsed = createRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const role = await this.service.createRole(tenantId, parsed.data);

    return c.json({
      success: true,
      data: role,
      meta: null,
      traceId: c.get("traceId" as any),
    }, 201);
  };

  updateRole = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const body = await c.req.json().catch(() => ({}));

    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const role = await this.service.updateRole(id, tenantId, parsed.data);

    return c.json({
      success: true,
      data: role,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  deleteRole = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    await this.service.deleteRole(id, tenantId);

    return c.json({
      success: true,
      data: { id },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };
}
