import type { Context } from "hono";
import { UsersService } from "./users.service";
import { parsePaginationParams, buildPaginationMeta } from "../../common/utils/query";
import { createUserSchema, updateUserSchema } from "./users.schema";
import { ValidationError } from "../../common/errors";

export class UsersController {
  private service = new UsersService();

  getUsers = async (c: Context) => {
    const { page, pageSize } = parsePaginationParams(c);
    const { items, totalItems } = await this.service.getUsers(page, pageSize);

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
    const id = c.req.param("id") as string;
    const user = await this.service.getUserById(id);

    return c.json({
      success: true,
      data: user,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  createUser = async (c: Context) => {
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
    const id = c.req.param("id") as string;
    const body = await c.req.json().catch(() => ({}));

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    const user = await this.service.updateUser(id, parsed.data);

    return c.json({
      success: true,
      data: user,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  deleteUser = async (c: Context) => {
    const id = c.req.param("id") as string;
    const user = await this.service.deleteUser(id);

    return c.json({
      success: true,
      data: user,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };
}
