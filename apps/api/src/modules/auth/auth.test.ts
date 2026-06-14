import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../../database/db";
import { platformUsers, passwordResetTokens, userSessions, refreshTokens } from "../../database/schema";
import { eq, and } from "drizzle-orm";
import { AuthService } from "./auth.service";
import { createTestContext, createUserHelper, createTenantHelper, createTenantUserMembership, cleanUpTestEntities } from "../../common/test-helpers";
import crypto from "crypto";

describe("AuthService Suite", () => {
  const authService = new AuthService();
  const ctx = createTestContext();
  const testPassword = "SecurePassword123!";
  const testEmailPrefix = "temp_auth_flow";
  
  let user: any;
  let tenant: any;

  beforeAll(async () => {
    // Generar hash de contraseña
    const passwordHash = await Bun.password.hash(testPassword);
    // Crear Tenant
    tenant = await createTenantHelper(ctx, "AUTH_TEST");
    // Crear Usuario
    user = await createUserHelper(ctx, testEmailPrefix, passwordHash);
    // Asociar usuario al Tenant
    await createTenantUserMembership(tenant.id, user.id);
  });

  afterAll(async () => {
    await cleanUpTestEntities(ctx);
  });

  test("Debería iniciar sesión correctamente con credenciales válidas", async () => {
    const res = await authService.login({
      email: user.email,
      password: testPassword,
      accessChannel: "WEB",
      tenantId: tenant.id,
    });

    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(res.user?.email).toBe(user.email);
    expect(res.tenantId).toBe(tenant.id);
  });

  test("Debería fallar al iniciar sesión con contraseña incorrecta", async () => {
    expect(
      authService.login({
        email: user.email,
        password: "WrongPassword!",
        accessChannel: "WEB",
      })
    ).rejects.toThrow("Credenciales incorrectas.");

    // Verificar incremento de intentos fallidos
    const [updatedUser] = await db.select().from(platformUsers).where(eq(platformUsers.id, user.id));
    expect(updatedUser.failedLoginAttempts).toBeGreaterThan(0);
  });

  test("Debería fallar al iniciar sesión con un usuario inexistente", async () => {
    expect(
      authService.login({
        email: "nonexistent@test.local",
        password: testPassword,
        accessChannel: "WEB",
      })
    ).rejects.toThrow("Credenciales incorrectas.");
  });

  test("Debería rotar el refresh token y emitir nuevos tokens", async () => {
    const loginRes = await authService.login({
      email: user.email,
      password: testPassword,
      accessChannel: "WEB",
      tenantId: tenant.id,
    });

    const rotateRes = await authService.rotateRefreshToken(loginRes.refreshToken);
    expect(rotateRes.accessToken).toBeDefined();
    expect(rotateRes.refreshToken).toBeDefined();
    expect(rotateRes.user?.email).toBe(user.email);

    // Intentar reutilizar el token viejo de refresco debería fallar e invalidar la sesión
    expect(
      authService.rotateRefreshToken(loginRes.refreshToken)
    ).rejects.toThrow("Alerta de seguridad: Token de refresco reutilizado. Sesiones revocadas.");
  });

  test("Debería solicitar recuperación de contraseña para un email registrado", async () => {
    const result = await authService.requestPasswordReset(user.email);
    expect(result.success).toBe(true);

    const tokens = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));
    
    expect(tokens.length).toBe(1);
    expect(tokens[0].usedAt).toBeNull();
  });

  test("Debería restablecer la contraseña con un token válido", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const newPassword = "NewPasswordABC123!";
    const resetRes = await authService.resetPassword(rawToken, newPassword);
    expect(resetRes.success).toBe(true);

    // Verificar que se puede iniciar sesión con la nueva contraseña
    const loginRes = await authService.login({
      email: user.email,
      password: newPassword,
      accessChannel: "WEB",
      tenantId: tenant.id,
    });
    expect(loginRes.accessToken).toBeDefined();
  });
});
