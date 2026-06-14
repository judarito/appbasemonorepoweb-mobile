import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../../database/db";
import { auditLogs, platformUsers } from "../../database/schema";
import { eq, and } from "drizzle-orm";
import { auditService } from "../../common/audit.service";
import { AuthService } from "./auth.service";
import { createTestContext, createUserHelper, createTenantHelper, cleanUpTestEntities } from "../../common/test-helpers";

describe("Audit Logging Security Suite", () => {
  const ctx = createTestContext();
  const authService = new AuthService();
  
  let tenant: any;
  let user: any;
  const testPassword = "AuditSecurePass123!";

  beforeAll(async () => {
    tenant = await createTenantHelper(ctx, "AUDIT_TEST");
    const passwordHash = await Bun.password.hash(testPassword);
    user = await createUserHelper(ctx, "audit_user", passwordHash);
  });

  afterAll(async () => {
    // Eliminar logs generados por este test
    await db.delete(auditLogs).where(eq(auditLogs.actorUserId, user.id));
    await cleanUpTestEntities(ctx);
  });

  test("Debería registrar un log de auditoría enmascarando campos sensibles", async () => {
    const actionName = "TEST_AUDIT_ACTION";
    
    // Logear síncronamente para garantizar escritura antes de la aserción
    await auditService.logSync({
      tenantId: tenant.id,
      actorUserId: user.id,
      action: actionName,
      entityType: "USER",
      entityId: user.id,
      result: "SUCCESS",
      beforeData: {
        username: "test_username",
        password: "SuperSecretPassword123", // Sensible
      },
      afterData: {
        secretToken: "xyz123abc", // Sensible
        nonSensitiveField: "Allowed Value",
      },
      metadata: {
        apiKey: "somekey", // Sensible
      }
    });

    // Buscar en la base de datos
    const dbLog = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.actorUserId, user.id), eq(auditLogs.action, actionName)))
      .limit(1)
      .then((res) => res[0]);

    expect(dbLog).toBeDefined();
    expect(dbLog.result).toBe("SUCCESS");
    
    // Validar enmascaramiento de campos sensibles
    expect((dbLog.beforeData as any).username).toBe("test_username");
    expect((dbLog.beforeData as any).password).toBe("***REDACTED***");
    expect((dbLog.afterData as any).secretToken).toBe("***REDACTED***");
    expect((dbLog.afterData as any).nonSensitiveField).toBe("Allowed Value");
    expect((dbLog.metadata as any).apiKey).toBe("***REDACTED***");
  });

  test("Debería registrar un log AUTH_LOGIN_SUCCESS en base de datos al autenticarse exitosamente", async () => {
    // Crear la membresía requerida para el login
    await db.insert(require("../../database/schema").tenantUsers).values({
      tenantId: tenant.id,
      userId: user.id,
      status: "ACTIVE",
    });

    await authService.login({
      email: user.email,
      password: testPassword,
      accessChannel: "WEB",
      tenantId: tenant.id,
    });

    // Esperar a que se procese el log asíncrono
    await Bun.sleep(100);

    // Buscar el log en la DB
    const successLogs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.actorUserId, user.id),
          eq(auditLogs.action, "AUTH_LOGIN_SUCCESS")
        )
      );

    expect(successLogs.length).toBeGreaterThan(0);
    expect(successLogs[0].result).toBe("SUCCESS");
    expect((successLogs[0].metadata as any).roles).toBeDefined();
  });

  test("Debería registrar un log AUTH_LOGIN_FAILED al fallar credenciales", async () => {
    try {
      await authService.login({
        email: user.email,
        password: "IncorrectPassword123",
        accessChannel: "WEB",
      });
    } catch {
      // Ignorar excepción intencional
    }

    // Esperar a que se procese el log asíncrono
    await Bun.sleep(100);

    // Buscar el log en la DB
    const failureLogs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.actorUserId, user.id),
          eq(auditLogs.action, "AUTH_LOGIN_FAILED")
        )
      );

    expect(failureLogs.length).toBeGreaterThan(0);
    expect(failureLogs[0].result).toBe("FAILURE");
    expect((failureLogs[0].metadata as any).reason).toBe("INVALID_PASSWORD");
  });
});
