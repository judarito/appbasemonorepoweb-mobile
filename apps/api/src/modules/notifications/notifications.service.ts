import { db } from "../../database/db";
import { notifications, platformUsers } from "../../database/schema";
import { eq, and, desc, sql, count, lt, gt } from "drizzle-orm";
import { NotFoundError } from "../../common/errors";
import { NOTIFICATION_TEMPLATES, renderTemplate } from "./notifications.config";
import type { CursorPayload } from "../../common/utils/query";

export class NotificationsService {
  /**
   * Obtiene notificaciones con soporte de paginación por cursor o por offset.
   * - Si se provee `afterCursor`, usa cursor (recomendado para performance).
   * - Si se provee `page`, usa offset (backward compatible).
   */
  async getNotifications(
    userId: string,
    tenantId: string,
    page: number,
    limit: number,
    afterCursor?: CursorPayload
  ) {
    const baseWhere = and(
      eq(notifications.recipientUserId, userId),
      eq(notifications.tenantId, tenantId)
    );

    // Modo cursor: más eficiente con volúmenes grandes
    if (afterCursor) {
      // Obtener items posteriores al cursor (created_at < cursorDate OR (created_at = cursorDate AND id < cursorId))
      const items = await db
        .select()
        .from(notifications)
        .where(
          and(
            baseWhere,
            lt(notifications.createdAt, new Date(afterCursor.createdAt))
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(limit + 1); // +1 para detectar hasNextPage

      const hasNextPage = items.length > limit;
      const pageItems = hasNextPage ? items.slice(0, limit) : items;

      return {
        items: pageItems,
        totalItems: -1, // No disponible en modo cursor (evita COUNT costoso)
        cursor: {
          hasNextPage,
          nextCursor: hasNextPage && pageItems.length > 0
            ? Buffer.from(JSON.stringify({
                id: pageItems[pageItems.length - 1].id,
                createdAt: pageItems[pageItems.length - 1].createdAt,
              })).toString("base64url")
            : null,
        },
      };
    }

    // Modo offset (backward compatible)
    const offset = (page - 1) * limit;
    const [items, total] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(baseWhere)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(notifications)
        .where(baseWhere)
        .then((res) => res[0].value),
    ]);

    return {
      items,
      totalItems: total,
    };
  }

  async createNotification(
    tenantId: string,
    recipientUserId: string,
    data: {
      type: string;
      title: string;
      body: string;
      priority?: string;
      data?: any;
    }
  ) {
    const [inserted] = await db
      .insert(notifications)
      .values({
        tenantId,
        recipientUserId,
        type: data.type,
        title: data.title,
        body: data.body,
        priority: data.priority || "NORMAL",
        data: data.data || {},
      })
      .returning();

    return inserted;
  }

  async markAsRead(userId: string, tenantId: string, id: string) {
    const [updated] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.recipientUserId, userId),
          eq(notifications.tenantId, tenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new NotFoundError("Notificación no encontrada.");
    }

    return updated;
  }

  async markAllAsRead(userId: string, tenantId: string) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.recipientUserId, userId),
          eq(notifications.tenantId, tenantId)
        )
      );

    return { success: true };
  }

  async getUserPreferences(userId: string, tenantId: string) {
    const user = await db
      .select({ metadata: platformUsers.metadata })
      .from(platformUsers)
      .where(eq(platformUsers.id, userId))
      .limit(1)
      .then((res) => res[0]);

    if (!user) {
      throw new NotFoundError("Usuario no encontrado.");
    }

    const metadata = user.metadata as any;
    const preferences = metadata?.notificationPreferences?.[tenantId] || {
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
    };

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    tenantId: string,
    preferences: { emailEnabled: boolean; pushEnabled: boolean; inAppEnabled: boolean }
  ) {
    const user = await db
      .select({ metadata: platformUsers.metadata })
      .from(platformUsers)
      .where(eq(platformUsers.id, userId))
      .limit(1)
      .then((res) => res[0]);

    if (!user) {
      throw new NotFoundError("Usuario no encontrado.");
    }

    const metadata = (user.metadata as any) || {};
    const notificationPreferences = metadata.notificationPreferences || {};
    notificationPreferences[tenantId] = preferences;
    metadata.notificationPreferences = notificationPreferences;

    await db
      .update(platformUsers)
      .set({ metadata })
      .where(eq(platformUsers.id, userId));

    return preferences;
  }

  async sendNotificationFromTemplate(
    tenantId: string,
    recipientUserId: string,
    templateCode: string,
    variables: Record<string, string>
  ) {
    const template = NOTIFICATION_TEMPLATES[templateCode];
    if (!template) {
      throw new Error(`Plantilla de notificación no encontrada: ${templateCode}`);
    }

    let tenantEmailEnabled = true;
    let tenantInAppEnabled = true;

    try {
      const { SettingsService } = require("../settings/settings.service");
      const settingsService = new SettingsService();
      tenantEmailEnabled = await settingsService.getInternalValue(tenantId, "notifications.email.enabled");
      tenantInAppEnabled = await settingsService.getInternalValue(tenantId, "notifications.in_app.enabled");
    } catch (err: any) {
      console.warn("Could not load SettingsService, using defaults for notifications:", err.message);
    }

    const userPref = await this.getUserPreferences(recipientUserId, tenantId);

    const renderedTitle = renderTemplate(template.title, variables);
    const renderedBody = renderTemplate(template.body, variables);

    let createdInAppNotification = null;

    if (template.channels.includes("IN_APP") && tenantInAppEnabled && userPref.inAppEnabled) {
      createdInAppNotification = await this.createNotification(tenantId, recipientUserId, {
        type: templateCode,
        title: renderedTitle,
        body: renderedBody,
        priority: "NORMAL",
      });
    }

    if (template.channels.includes("EMAIL") && tenantEmailEnabled && userPref.emailEnabled) {
      console.log(`[SIMULACIÓN EMAIL] Enviando correo a usuario ${recipientUserId} en tenant ${tenantId}: "${renderedTitle}" - ${renderedBody}`);
    }

    if (template.channels.includes("PUSH") && userPref.pushEnabled) {
      console.log(`[SIMULACIÓN PUSH] Enviando notificación push a usuario ${recipientUserId} en tenant ${tenantId}: "${renderedTitle}" - ${renderedBody}`);
    }

    return {
      success: true,
      inAppNotification: createdInAppNotification,
    };
  }
}

