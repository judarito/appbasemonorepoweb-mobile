import type { Context } from "hono";
import { MenusService } from "./menus.service";
import { createMenuSchema, updateMenuSchema, associateRolesSchema } from "./menus.schema";
import { ValidationError } from "../../common/errors";

export class MenusController {
  private service = new MenusService();

  getMenus = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const platform = c.req.query("platform") as "WEB" | "MOBILE" | "BOTH" | undefined;
    const items = await this.service.getMenus(tenantId, platform);

    return c.json({
      success: true,
      data: {
        items,
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  getMenu = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const menu = await this.service.getMenu(id, tenantId);

    return c.json({
      success: true,
      data: menu,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  createMenu = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const body = await c.req.json().catch(() => ({}));

    const parsed = createMenuSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const menu = await this.service.createMenu(tenantId, parsed.data);

    return c.json({
      success: true,
      data: menu,
      meta: null,
      traceId: c.get("traceId" as any),
    }, 201);
  };

  updateMenu = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const body = await c.req.json().catch(() => ({}));

    const parsed = updateMenuSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const menu = await this.service.updateMenu(id, tenantId, parsed.data);

    return c.json({
      success: true,
      data: menu,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  deleteMenu = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const menu = await this.service.deleteMenu(id, tenantId);

    return c.json({
      success: true,
      data: menu,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  associateRoles = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const body = await c.req.json().catch(() => ({}));

    const parsed = associateRolesSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const result = await this.service.associateRoles(id, tenantId, parsed.data.roleIds);

    return c.json({
      success: true,
      data: result,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  getAssociatedRoles = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const result = await this.service.getAssociatedRoles(id, tenantId);

    return c.json({
      success: true,
      data: {
        roles: result.map((r) => r.roleId),
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };
}
