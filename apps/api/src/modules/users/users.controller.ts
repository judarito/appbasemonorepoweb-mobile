import type { Context } from "hono";
import { UsersService } from "./users.service";
import { parsePaginationParams, buildPaginationMeta } from "../../common/utils/query";
import { createUserSchema, updateUserSchema } from "./users.schema";
import { ValidationError } from "../../common/errors";

export class UsersController {
  private service = new UsersService();

  getUsers = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    const { page, pageSize } = parsePaginationParams(c);
    const { items, totalItems } = await this.service.getUsers(tenantId, page, pageSize);

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
    // Nota: El tenantId no se toma del body por razones de seguridad (aislamiento).
    // Si se requiere vincular al tenant del usuario autenticado, se puede asociar en capas superiores.
    const body = await c.req.json().catch(() => ({}));
    
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const user = await this.service.createUser(parsed.data);

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
}
