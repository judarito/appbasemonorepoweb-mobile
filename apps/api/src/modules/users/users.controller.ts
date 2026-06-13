import type { Context } from "hono";
import { UsersService } from "./users.service";
import { parsePaginationParams, buildPaginationMeta } from "../../common/utils/query";
import { createUserSchema, updateUserSchema, updateStatusSchema, assignRolesSchema } from "./users.schema";
import { ValidationError } from "../../common/errors";

export class UsersController {
  private service = new UsersService();

  getUsers = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const { page, pageSize } = parsePaginationParams(c);

    // Parámetros de filtros y búsqueda
    const q = c.req.query("q");
    const status = c.req.query("status");
    const roleId = c.req.query("roleId");
    const orderBy = c.req.query("orderBy");
    const orderDirection = c.req.query("orderDirection") as "asc" | "desc" | undefined;

    const { items, totalItems } = await this.service.getUsers(tenantId, page, pageSize, {
      search: q,
      status,
      roleId,
      orderBy,
      orderDirection,
    });

    return c.json({
      success: true,
      data: {
        items,
      },
      meta: buildPaginationMeta(page, pageSize, totalItems),
      traceId: c.get("traceId" as any),
    });
  };

  getUser = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const user = await this.service.getUserById(id, tenantId);

    return c.json({
      success: true,
      data: user,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  createUser = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const body = await c.req.json().catch(() => ({}));
    
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const user = await this.service.createUser(tenantId, parsed.data);

    return c.json({
      success: true,
      data: user,
      meta: null,
      traceId: c.get("traceId" as any),
    }, 201);
  };

  updateUser = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const body = await c.req.json().catch(() => ({}));

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const user = await this.service.updateUser(id, tenantId, parsed.data);

    return c.json({
      success: true,
      data: user,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  deleteUser = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const user = await this.service.deleteUser(id, tenantId);

    return c.json({
      success: true,
      data: user,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  updateStatus = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const actorUser = c.get("user" as any);
    const body = await c.req.json().catch(() => ({}));

    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("El estado suministrado no es válido.", parsed.error.issues);
    }

    const user = await this.service.updateStatus(id, tenantId, parsed.data.status, actorUser.id);

    return c.json({
      success: true,
      data: user,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  getUserSessions = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const sessions = await this.service.getUserSessions(id, tenantId);

    return c.json({
      success: true,
      data: {
        sessions,
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  revokeUserSessions = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const result = await this.service.revokeUserSessions(id, tenantId);

    return c.json({
      success: true,
      data: result,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  assignRoles = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const id = c.req.param("id") as string;
    const actorUser = c.get("user" as any);
    const body = await c.req.json().catch(() => ({}));

    const parsed = assignRolesSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    if (!tenantId) {
      throw new ValidationError("La asignación de roles de usuario requiere el contexto de un inquilino.", []);
    }

    const result = await this.service.assignRoles(id, tenantId, parsed.data.roleIds, actorUser.id);

    return c.json({
      success: true,
      data: result,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };
}
