import { db } from "../../database/db";
import { platformUsers, tenants, tenantUsers, userSessions, refreshTokens, userRoles, roles, rolePermissions, permissions } from "../../database/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { sign, verify } from "hono/jwt";
import { env } from "../../config/env";
import { UnauthorizedError, NotFoundError, ConflictError } from "../../common/errors";
import type { LoginInput } from "./auth.schema";

export interface TokenPayload {
  sub: string;
  tenantId: string | null;
  sessionId: string;
  roles: string[];
  permissions: string[];
  tokenVersion: number;
}

export class AuthService {
  private sanitizeUser(user: any) {
    if (!user) return null;
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async login(data: LoginInput & { ipAddress?: string; userAgent?: string; deviceName?: string }) {
    // 1. Buscar usuario por email
    const user = await db
      .select()
      .from(platformUsers)
      .where(and(eq(platformUsers.email, data.email.toLowerCase()), isNull(platformUsers.deletedAt)))
      .limit(1)
      .then((res) => res[0]);

    if (!user) {
      throw new UnauthorizedError("Credenciales incorrectas.");
    }

    // 2. Verificar contraseña
    const isPasswordValid = await Bun.password.verify(data.password, user.passwordHash);
    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      await db.update(platformUsers).set({
        failedLoginAttempts: user.failedLoginAttempts + 1
      }).where(eq(platformUsers.id, user.id));

      throw new UnauthorizedError("Credenciales incorrectas.");
    }

    // Resetear intentos fallidos
    if (user.failedLoginAttempts > 0) {
      await db.update(platformUsers).set({ failedLoginAttempts: 0 }).where(eq(platformUsers.id, user.id));
    }

    // 3. Validar estado del usuario
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError("La cuenta del usuario no se encuentra activa.");
    }

    // 4. Resolver Tenant Context
    let resolvedTenantId: string | null = null;
    const memberships = await db
      .select()
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
      .where(
        and(
          eq(tenantUsers.userId, user.id),
          eq(tenantUsers.status, "ACTIVE"),
          eq(tenants.status, "ACTIVE"),
          isNull(tenantUsers.deletedAt),
          isNull(tenants.deletedAt)
        )
      );

    if (data.tenantId) {
      const match = memberships.find((m) => m.tenant_users.tenantId === data.tenantId);
      if (!match) {
        throw new UnauthorizedError("El usuario no es miembro activo del inquilino solicitado.");
      }
      resolvedTenantId = data.tenantId;
    } else if (memberships.length > 0) {
      // Tomar primer tenant como default
      resolvedTenantId = memberships[0].tenant_users.tenantId;
    }

    // 5. Cargar Roles y Permisos para el Tenant resuelto
    let userRolesList: string[] = [];
    let userPermissionsList: string[] = [];

    // 5. Cargar Roles y Permisos (globales o del Tenant)
    const dbRoles = await db
      .select({ code: roles.code })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, user.id),
          resolvedTenantId ? eq(userRoles.tenantId, resolvedTenantId) : isNull(userRoles.tenantId),
          isNull(userRoles.revokedAt),
          isNull(roles.deletedAt)
        )
      );
    userRolesList = dbRoles.map((r) => r.code);

    const dbPermissions = await db
      .select({ code: permissions.code })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userRoles.userId, user.id),
          resolvedTenantId ? eq(userRoles.tenantId, resolvedTenantId) : isNull(userRoles.tenantId),
          isNull(userRoles.revokedAt),
          isNull(roles.deletedAt)
        )
      );
    userPermissionsList = Array.from(new Set(dbPermissions.map((p) => p.code)));

    // 6. Crear Registro de Sesión
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    const [session] = await db
      .insert(userSessions)
      .values({
        userId: user.id,
        tenantId: resolvedTenantId,
        status: "ACTIVE",
        accessChannel: data.accessChannel,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        deviceName: data.deviceName || null,
        expiresAt: sessionExpiresAt,
      })
      .returning();

    // 7. Crear Registro de Refresh Token (Familia inicial)
    const familyId = crypto.randomUUID();
    const tokenString = crypto.randomUUID() + "." + crypto.randomUUID();
    const tokenHash = await Bun.password.hash(tokenString);

    const [dbRefreshToken] = await db
      .insert(refreshTokens)
      .values({
        sessionId: session.id,
        familyId,
        tokenHash,
        expiresAt: sessionExpiresAt,
      })
      .returning();

    // Actualizar última fecha de login en usuario
    await db.update(platformUsers).set({ lastLoginAt: new Date() }).where(eq(platformUsers.id, user.id));

    // 8. Firmar Tokens
    const accessToken = await this.signAccessToken({
      sub: user.id,
      tenantId: resolvedTenantId,
      sessionId: session.id,
      roles: userRolesList,
      permissions: userPermissionsList,
      tokenVersion: user.tokenVersion,
    });

    const refreshTokenJwt = await this.signRefreshToken(dbRefreshToken.id, session.id, familyId, tokenString, dbRefreshToken.expiresAt);

    return {
      accessToken,
      refreshToken: refreshTokenJwt,
      user: this.sanitizeUser(user),
      tenantId: resolvedTenantId,
    };
  }

  async rotateRefreshToken(tokenJwt: string) {
    let payload: any;
    try {
      payload = await verify(tokenJwt, env.JWT_REFRESH_SECRET, "HS256");
    } catch {
      throw new UnauthorizedError("Token de refresco inválido o expirado.");
    }

    const { jti, sessionId, familyId, tokenString } = payload;

    // 1. Buscar token en DB
    const dbToken = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, jti))
      .limit(1)
      .then((res) => res[0]);

    if (!dbToken) {
      throw new UnauthorizedError("Sesión inválida.");
    }

    // 2. Detección de reutilización fraudulenta
    if (dbToken.consumedAt || dbToken.revokedAt) {
      // Revocar toda la sesión
      await db.update(userSessions).set({ status: "REVOKED", revokeReason: "REUSE_DETECTED" }).where(eq(userSessions.id, sessionId));
      await db.update(refreshTokens).set({ revokedAt: new Date(), reuseDetectedAt: new Date() }).where(eq(refreshTokens.familyId, familyId));

      throw new UnauthorizedError("Alerta de seguridad: Token de refresco reutilizado. Sesiones revocadas.");
    }

    // 3. Validar token string contra el hash
    const isHashValid = await Bun.password.verify(tokenString, dbToken.tokenHash);
    if (!isHashValid) {
      throw new UnauthorizedError("Token de refresco inválido.");
    }

    // 4. Validar expiración del token
    if (new Date() > dbToken.expiresAt) {
      throw new UnauthorizedError("Token de refresco expirado.");
    }

    // 5. Validar estado de la sesión
    const session = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, sessionId))
      .limit(1)
      .then((res) => res[0]);

    if (!session || session.status !== "ACTIVE") {
      throw new UnauthorizedError("Sesión inactiva o revocada.");
    }

    // 6. Validar estado del usuario
    const user = await db
      .select()
      .from(platformUsers)
      .where(eq(platformUsers.id, session.userId))
      .limit(1)
      .then((res) => res[0]);

    if (!user || user.status !== "ACTIVE" || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedError("Acceso denegado.");
    }

    // 7. Consumir token actual
    await db.update(refreshTokens).set({ consumedAt: new Date() }).where(eq(refreshTokens.id, dbToken.id));

    // 8. Crear nuevo refresh token de reemplazo en la misma familia
    const newTokenString = crypto.randomUUID() + "." + crypto.randomUUID();
    const newTokenHash = await Bun.password.hash(newTokenString);

    const [newDbToken] = await db
      .insert(refreshTokens)
      .values({
        sessionId: session.id,
        familyId,
        parentTokenId: dbToken.id,
        tokenHash: newTokenHash,
        expiresAt: dbToken.expiresAt, // Mantiene la expiración original de la sesión
      })
      .returning();

    // 9. Recargar Roles y Permisos vigentes
    let userRolesList: string[] = [];
    let userPermissionsList: string[] = [];

    // 9. Recargar Roles y Permisos vigentes (globales o del Tenant)
    const dbRoles = await db
      .select({ code: roles.code })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, user.id),
          session.tenantId ? eq(userRoles.tenantId, session.tenantId) : isNull(userRoles.tenantId),
          isNull(userRoles.revokedAt),
          isNull(roles.deletedAt)
        )
      );
    userRolesList = dbRoles.map((r) => r.code);

    const dbPermissions = await db
      .select({ code: permissions.code })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userRoles.userId, user.id),
          session.tenantId ? eq(userRoles.tenantId, session.tenantId) : isNull(userRoles.tenantId),
          isNull(userRoles.revokedAt),
          isNull(roles.deletedAt)
        )
      );
    userPermissionsList = Array.from(new Set(dbPermissions.map((p) => p.code)));

    // 10. Firmar nuevos tokens
    const accessToken = await this.signAccessToken({
      sub: user.id,
      tenantId: session.tenantId,
      sessionId: session.id,
      roles: userRolesList,
      permissions: userPermissionsList,
      tokenVersion: user.tokenVersion,
    });

    const newRefreshTokenJwt = await this.signRefreshToken(
      newDbToken.id,
      session.id,
      familyId,
      newTokenString,
      newDbToken.expiresAt
    );

    return {
      accessToken,
      refreshToken: newRefreshTokenJwt,
      user: this.sanitizeUser(user),
      tenantId: session.tenantId,
    };
  }

  async logout(sessionId: string) {
    await db.update(userSessions).set({ status: "REVOKED", revokedAt: new Date(), revokeReason: "LOGOUT" }).where(eq(userSessions.id, sessionId));
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.sessionId, sessionId));
  }

  private async signAccessToken(payload: Omit<TokenPayload, "exp" | "iat">) {
    const exp = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutos
    const iat = Math.floor(Date.now() / 1000);

    return await sign(
      {
        ...payload,
        exp,
        iat,
      },
      env.JWT_ACCESS_SECRET
    );
  }

  private async signRefreshToken(
    jti: string,
    sessionId: string,
    familyId: string,
    tokenString: string,
    expiresAt: Date
  ) {
    const exp = Math.floor(expiresAt.getTime() / 1000);
    const iat = Math.floor(Date.now() / 1000);

    return await sign(
      {
        jti,
        sessionId,
        familyId,
        tokenString,
        exp,
        iat,
      },
      env.JWT_REFRESH_SECRET
    );
  }
}
