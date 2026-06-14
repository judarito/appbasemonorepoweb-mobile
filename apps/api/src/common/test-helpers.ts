import { db } from "../database/db";
import { platformUsers, tenants, tenantUsers, userRoles, roles, rolePermissions, permissions } from "../database/schema";
import { eq, inArray } from "drizzle-orm";
import { sign } from "hono/jwt";
import { env } from "../config/env";

export interface TestContext {
  tenantIds: string[];
  userIds: string[];
  roleIds: string[];
  permissionIds: string[];
}

export const createTestContext = (): TestContext => ({
  tenantIds: [],
  userIds: [],
  roleIds: [],
  permissionIds: [],
});

export async function createTenantHelper(ctx: TestContext, code: string) {
  const uniqueId = crypto.randomUUID().slice(0, 8);
  const finalCode = `${code}_${uniqueId}`;
  const [tenant] = await db
    .insert(tenants)
    .values({
      code: finalCode,
      slug: finalCode.toLowerCase(),
      displayName: `Test Tenant ${finalCode}`,
    })
    .returning();
  
  ctx.tenantIds.push(tenant.id);
  return tenant;
}

export async function createUserHelper(ctx: TestContext, emailPrefix: string, passwordHash: string = "dummyhash") {
  const uniqueId = crypto.randomUUID().slice(0, 8);
  const email = `${emailPrefix}_${uniqueId}@test.local`.toLowerCase();
  const [user] = await db
    .insert(platformUsers)
    .values({
      email,
      passwordHash,
      firstName: "Test",
      lastName: "User",
      status: "ACTIVE",
    })
    .returning();

  ctx.userIds.push(user.id);
  return user;
}

export async function createTenantUserMembership(tenantId: string, userId: string) {
  await db.insert(tenantUsers).values({
    tenantId,
    userId,
    status: "ACTIVE",
  });
}

export async function createRoleWithPermissions(ctx: TestContext, tenantId: string | null, roleCode: string, permissionCodes: string[]) {
  const uniqueId = crypto.randomUUID().slice(0, 8);
  const finalRoleCode = `${roleCode}_${uniqueId}`;
  
  // 1. Crear Rol
  const [role] = await db
    .insert(roles)
    .values({
      tenantId,
      code: finalRoleCode,
      name: `Test Role ${finalRoleCode}`,
      scope: tenantId ? "TENANT" : "SYSTEM",
    })
    .returning();
  
  ctx.roleIds.push(role.id);

  // 2. Resolver o Crear Permisos y enlazarlos
  for (const permCode of permissionCodes) {
    let perm = await db
      .select()
      .from(permissions)
      .where(eq(permissions.code, permCode))
      .limit(1)
      .then((res) => res[0]);

    if (!perm) {
      const [newPerm] = await db
        .insert(permissions)
        .values({
          code: permCode,
          resource: permCode.split(":")[0] || "test",
          action: permCode.split(":")[1] || "all",
          name: `Test Perm ${permCode}`,
          scope: tenantId ? "TENANT" : "SYSTEM",
        })
        .returning();
      perm = newPerm;
      ctx.permissionIds.push(perm.id);
    }

    await db.insert(rolePermissions).values({
      roleId: role.id,
      permissionId: perm.id,
    });
  }

  return role;
}

export async function assignRoleToUser(tenantId: string | null, userId: string, roleId: string) {
  await db.insert(userRoles).values({
    tenantId,
    userId,
    roleId,
  });
}

export async function generateAuthToken(
  userId: string,
  tenantId: string | null,
  rolesList: string[],
  permissionsList: string[],
  sessionId: string = crypto.randomUUID()
) {
  const exp = Math.floor(Date.now() / 1000) + 15 * 60; // 15 min
  const iat = Math.floor(Date.now() / 1000);

  return await sign(
    {
      sub: userId,
      tenantId,
      sessionId,
      roles: rolesList,
      permissions: permissionsList,
      tokenVersion: 1,
      exp,
      iat,
    },
    env.JWT_ACCESS_SECRET
  );
}

export async function cleanUpTestEntities(ctx: TestContext) {
  // Eliminar relaciones primero
  if (ctx.userIds.length > 0) {
    await db.delete(userRoles).where(inArray(userRoles.userId, ctx.userIds));
    await db.delete(tenantUsers).where(inArray(tenantUsers.userId, ctx.userIds));
  }
  
  if (ctx.roleIds.length > 0) {
    await db.delete(rolePermissions).where(inArray(rolePermissions.roleId, ctx.roleIds));
  }

  // Eliminar entidades principales
  if (ctx.userIds.length > 0) {
    await db.delete(platformUsers).where(inArray(platformUsers.id, ctx.userIds));
  }

  if (ctx.roleIds.length > 0) {
    await db.delete(roles).where(inArray(roles.id, ctx.roleIds));
  }

  if (ctx.permissionIds.length > 0) {
    await db.delete(permissions).where(inArray(permissions.id, ctx.permissionIds));
  }

  if (ctx.tenantIds.length > 0) {
    await db.delete(tenants).where(inArray(tenants.id, ctx.tenantIds));
  }
}
