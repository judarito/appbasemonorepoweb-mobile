import type { Context } from "hono";
import { NotificationsService } from "./notifications.service";
import { parsePaginationParams, buildPaginationMeta } from "../../common/utils/query";
import { ForbiddenError } from "../../common/errors";
import { updateNotificationPreferencesSchema } from "@baseforge/validation";

export class NotificationsController {
  private service = new NotificationsService();

  getNotifications = async (c: Context) => {
    const user = c.get("user" as any);
    const tenantId = c.get("tenantId" as any) as string | null;
    if (!tenantId) {
      throw new ForbiddenError("El contexto de inquilino es requerido para listar notificaciones.");
    }

    const { page, pageSize } = parsePaginationParams(c);

    const { items, totalItems } = await this.service.getNotifications(
      user.id,
      tenantId,
      page,
      pageSize
    );

    return c.json({
      success: true,
      data: {
        items,
        totalItems,
      },
      meta: buildPaginationMeta(page, pageSize, totalItems),
      traceId: c.get("traceId" as any),
    });
  };

  markAsRead = async (c: Context) => {
    const user = c.get("user" as any);
    const tenantId = c.get("tenantId" as any) as string | null;
    if (!tenantId) {
      throw new ForbiddenError("El contexto de inquilino es requerido.");
    }

    const id = c.req.param("id") as string;
    const result = await this.service.markAsRead(user.id, tenantId, id);

    return c.json({
      success: true,
      data: result,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  markAllAsRead = async (c: Context) => {
    const user = c.get("user" as any);
    const tenantId = c.get("tenantId" as any) as string | null;
    if (!tenantId) {
      throw new ForbiddenError("El contexto de inquilino es requerido.");
    }

    const result = await this.service.markAllAsRead(user.id, tenantId);

    return c.json({
      success: true,
      data: result,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  getUserPreferences = async (c: Context) => {
    const user = c.get("user" as any);
    const tenantId = c.get("tenantId" as any) as string | null;
    if (!tenantId) {
      throw new ForbiddenError("El contexto de inquilino es requerido.");
    }

    const result = await this.service.getUserPreferences(user.id, tenantId);

    return c.json({
      success: true,
      data: result,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  updateUserPreferences = async (c: Context) => {
    const user = c.get("user" as any);
    const tenantId = c.get("tenantId" as any) as string | null;
    if (!tenantId) {
      throw new ForbiddenError("El contexto de inquilino es requerido.");
    }

    const body = await c.req.json();
    const parsed = updateNotificationPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Datos de preferencias inválidos.",
            details: parsed.error.errors,
          },
          traceId: c.get("traceId" as any),
        },
        400
      );
    }

    const result = await this.service.updateUserPreferences(user.id, tenantId, parsed.data);

    return c.json({
      success: true,
      data: result,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };
}

