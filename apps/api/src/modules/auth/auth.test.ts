import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../../database/db";
import { platformUsers, passwordResetTokens, userSessions } from "../../database/schema";
import { eq, and } from "drizzle-orm";
import { AuthService } from "./auth.service";
import crypto from "crypto";

describe("AuthService - Recuperación de Contraseña", () => {
  const authService = new AuthService();
  const testEmail = "temp_auth_test@baseforge.local";
  const initialPassword = "InitialSecurePassword123!";
  const newPassword = "NewAwesomePassword456!";
  let testUserId: string;

  beforeAll(async () => {
    // Limpiar si existe previamente
    await db.delete(platformUsers).where(eq(platformUsers.email, testEmail));

    // Crear usuario de prueba
    const passwordHash = await Bun.password.hash(initialPassword);
    const [user] = await db
      .insert(platformUsers)
      .values({
        email: testEmail,
        passwordHash,
        firstName: "Test",
        lastName: "User",
        status: "ACTIVE",
      })
      .returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    // Limpiar base de datos al finalizar
    if (testUserId) {
      await db.delete(platformUsers).where(eq(platformUsers.id, testUserId));
    }
  });

  test("Debería responder éxito simulado al solicitar recuperación para email no registrado", async () => {
    const result = await authService.requestPasswordReset("non_existent_email@test.com");
    expect(result.success).toBe(true);
    expect(result.message).toContain("se ha enviado un enlace de recuperación");

    // Verificar que no se generó ningún token en base de datos
    const tokens = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, "00000000-0000-0000-0000-000000000000")); // ID inexistente
    expect(tokens.length).toBe(0);
  });

  test("Debería generar un token de recuperación y enviar el email para un usuario existente", async () => {
    const result = await authService.requestPasswordReset(testEmail);
    expect(result.success).toBe(true);
    expect(result.message).toContain("se ha enviado un enlace de recuperación");

    // Obtener el token creado en base de datos
    const tokens = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, testUserId));
    
    expect(tokens.length).toBe(1);
    expect(tokens[0].usedAt).toBeNull();
    expect(new Date(tokens[0].expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  test("Debería fallar al restaurar contraseña con un token inválido", async () => {
    expect(
      authService.resetPassword("invalid-token-value-12345", newPassword)
    ).rejects.toThrow();
  });

  test("Debería restaurar la contraseña con éxito usando el token correcto", async () => {
    // 1. Obtener el token de base de datos
    const tokens = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, testUserId));
    
    expect(tokens.length).toBe(1);
    
    // Como el token se guarda hasheado con sha256 en base de datos,
    // debemos buscar cómo obtener el token original en texto plano.
    // Para la prueba unitaria, generaremos un nuevo token de recuperación
    // interceptando o creando un token manual en la base de datos.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    
    await db.insert(passwordResetTokens).values({
      userId: testUserId,
      tokenHash,
      expiresAt,
    });

    // 2. Ejecutar restablecimiento
    const result = await authService.resetPassword(rawToken, newPassword);
    expect(result.success).toBe(true);
    expect(result.message).toContain("Contraseña actualizada con éxito");

    // 3. Verificar que el token se marcó como usado
    const usedTokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, testUserId),
          eq(passwordResetTokens.tokenHash, tokenHash)
        )
      );
    expect(usedTokens[0].usedAt).not.toBeNull();

    // 4. Verificar que se puede iniciar sesión con la nueva contraseña
    const loginResult = await authService.login({
      email: testEmail,
      password: newPassword,
      accessChannel: "WEB",
    });
    expect(loginResult.user?.email).toBe(testEmail);

    // 5. Verificar que la contraseña anterior ya no funciona
    expect(
      authService.login({
        email: testEmail,
        password: initialPassword,
        accessChannel: "WEB",
      })
    ).rejects.toThrow();
  });
});
