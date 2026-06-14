import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../../database/db";
import { platformUsers, tenants, notifications } from "../../database/schema";
import { eq } from "drizzle-orm";
import { NotificationsService } from "./notifications.service";

describe("NotificationsService", () => {
  const service = new NotificationsService();
  const testEmail = "temp_notif_test@baseforge.local";
  let testUserId: string;
  let testTenantId: string;

  beforeAll(async () => {
    // 1. Limpiar usuario y tenant anteriores si existen
    await db.delete(platformUsers).where(eq(platformUsers.email, testEmail));
    await db.delete(tenants).where(eq(tenants.code, "NOTIF_TEST_TENANT"));

    // 2. Crear Tenant de prueba
    const [tenant] = await db
      .insert(tenants)
      .values({
        code: "NOTIF_TEST_TENANT",
        slug: "notif-test-tenant",
        displayName: "Notif Test Tenant",
      })
      .returning();
    testTenantId = tenant.id;

    // 3. Crear Usuario de prueba
    const [user] = await db
      .insert(platformUsers)
      .values({
        email: testEmail,
        passwordHash: "dummyhash",
        firstName: "Notif",
        lastName: "User",
        status: "ACTIVE",
      })
      .returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    // Limpiar registros creados
    if (testUserId) {
      await db.delete(platformUsers).where(eq(platformUsers.id, testUserId));
    }
    if (testTenantId) {
      await db.delete(tenants).where(eq(tenants.id, testTenantId));
    }
  });

  test("Debería crear una notificación con éxito", async () => {
    const notif = await service.createNotification(testTenantId, testUserId, {
      type: "ALERT",
      title: "Nueva Alerta",
      body: "Este es un mensaje de prueba para la alerta.",
    });

    expect(notif.id).toBeDefined();
    expect(notif.title).toBe("Nueva Alerta");
    expect(notif.body).toBe("Este es un mensaje de prueba para la alerta.");
    expect(notif.readAt).toBeNull();
  });

  test("Debería retornar el listado de notificaciones del usuario", async () => {
    const result = await service.getNotifications(testUserId, testTenantId, 1, 10);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.totalItems).toBeGreaterThan(0);
    expect(result.items[0].recipientUserId).toBe(testUserId);
  });

  test("Debería marcar una notificación como leída", async () => {
    const notif = await service.createNotification(testTenantId, testUserId, {
      type: "INFO",
      title: "Info no leída",
      body: "Contenido informativo.",
    });

    const updated = await service.markAsRead(testUserId, testTenantId, notif.id);
    expect(updated.readAt).not.toBeNull();
  });

  test("Debería marcar todas las notificaciones como leídas", async () => {
    await service.createNotification(testTenantId, testUserId, {
      type: "INFO",
      title: "Info 1",
      body: "Contenido informativo 1.",
    });
    await service.createNotification(testTenantId, testUserId, {
      type: "INFO",
      title: "Info 2",
      body: "Contenido informativo 2.",
    });

    const result = await service.markAllAsRead(testUserId, testTenantId);
    expect(result.success).toBe(true);

    const list = await service.getNotifications(testUserId, testTenantId, 1, 50);
    const unread = list.items.filter((n) => n.readAt === null);
    expect(unread.length).toBe(0);
  });

  test("Debería obtener y guardar preferencias de usuario por tenant", async () => {
    const defaultPref = await service.getUserPreferences(testUserId, testTenantId);
    expect(defaultPref.emailEnabled).toBe(true);
    expect(defaultPref.pushEnabled).toBe(true);
    expect(defaultPref.inAppEnabled).toBe(true);

    const updatedPref = await service.updateUserPreferences(testUserId, testTenantId, {
      emailEnabled: false,
      pushEnabled: true,
      inAppEnabled: false,
    });
    expect(updatedPref.emailEnabled).toBe(false);
    expect(updatedPref.inAppEnabled).toBe(false);

    const savedPref = await service.getUserPreferences(testUserId, testTenantId);
    expect(savedPref.emailEnabled).toBe(false);
    expect(savedPref.inAppEnabled).toBe(false);
  });

  test("Debería enviar una notificación usando una plantilla y variables", async () => {
    await service.updateUserPreferences(testUserId, testTenantId, {
      emailEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
    });

    const result = await service.sendNotificationFromTemplate(
      testTenantId,
      testUserId,
      "USER_WELCOME",
      {
        firstName: "Juan",
        tenantName: "BaseForge Demo",
      }
    );

    expect(result.success).toBe(true);
    expect(result.inAppNotification).not.toBeNull();
    expect(result.inAppNotification?.title).toContain("¡Bienvenido a BaseForge!");
    expect(result.inAppNotification?.body).toContain("Hola Juan, bienvenido a BaseForge Demo");
  });
});

