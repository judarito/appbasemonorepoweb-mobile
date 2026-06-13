import { db } from "../../database/db";
import { platformUsers, tenantUsers, userSessions, userRoles, roles } from "../../database/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import type { CreateUserInput, UpdateUserInput } from "./users.schema";

export class UsersRepository {
  async findById(id: string, tenantId: string | null) {
    if (!tenantId) {
      const results = await db
        .select()
        .from(platformUsers)
        .where(and(eq(platformUsers.id, id), isNull(platformUsers.deletedAt)))
        .limit(1);
      return results[0] || null;
    }

    const results = await db
      .select({
        id: platformUsers.id,
        email: platformUsers.email,
        firstName: platformUsers.firstName,
        lastName: platformUsers.lastName,
        displayName: platformUsers.displayName,
        phone: platformUsers.phone,
        status: platformUsers.status,
        membershipStatus: tenantUsers.status,
        locale: platformUsers.locale,
        timezone: platformUsers.timezone,
        emailVerifiedAt: platformUsers.emailVerifiedAt,
        createdAt: platformUsers.createdAt,
        updatedAt: platformUsers.updatedAt,
      })
      .from(platformUsers)
      .innerJoin(tenantUsers, eq(tenantUsers.userId, platformUsers.id))
      .where(
        and(
          eq(platformUsers.id, id),
          eq(tenantUsers.tenantId, tenantId),
          isNull(tenantUsers.deletedAt),
          isNull(platformUsers.deletedAt)
        )
      )
      .limit(1);
    return results[0] || null;
  }

  async findByEmail(email: string) {
    const results = await db
      .select()
      .from(platformUsers)
      .where(and(eq(platformUsers.email, email.toLowerCase()), isNull(platformUsers.deletedAt)))
      .limit(1);
    return results[0] || null;
  }

  async findMany(
    tenantId: string | null,
    page: number,
    pageSize: number,
    filters: { search?: string; status?: string; roleId?: string; orderBy?: string; orderDirection?: "asc" | "desc" } = {}
  ) {
    const offset = (page - 1) * pageSize;
    let query = db
      .select({
        id: platformUsers.id,
        email: platformUsers.email,
        firstName: platformUsers.firstName,
        lastName: platformUsers.lastName,
        displayName: platformUsers.displayName,
        phone: platformUsers.phone,
        status: platformUsers.status,
        membershipStatus: tenantId ? tenantUsers.status : sql`NULL`,
        locale: platformUsers.locale,
        timezone: platformUsers.timezone,
        emailVerifiedAt: platformUsers.emailVerifiedAt,
        createdAt: platformUsers.createdAt,
        updatedAt: platformUsers.updatedAt,
      })
      .from(platformUsers);

    if (tenantId) {
      query = query.innerJoin(tenantUsers, eq(tenantUsers.userId, platformUsers.id)) as any;
    }

    const whereConditions: any[] = [isNull(platformUsers.deletedAt)];
    if (tenantId) {
      whereConditions.push(eq(tenantUsers.tenantId, tenantId));
      whereConditions.push(isNull(tenantUsers.deletedAt));
    }

    if (filters.search) {
      const searchPattern = `%${filters.search.toLowerCase()}%`;
      whereConditions.push(
        sql`(${platformUsers.email} ILIKE ${searchPattern} OR ${platformUsers.firstName} ILIKE ${searchPattern} OR ${platformUsers.lastName} ILIKE ${searchPattern} OR ${platformUsers.displayName} ILIKE ${searchPattern})`
      );
    }

    if (filters.status) {
      if (tenantId) {
        whereConditions.push(eq(tenantUsers.status, filters.status));
      } else {
        whereConditions.push(eq(platformUsers.status, filters.status));
      }
    }

    if (filters.roleId) {
      query = query.innerJoin(userRoles, and(eq(userRoles.userId, platformUsers.id), isNull(userRoles.revokedAt))) as any;
      whereConditions.push(eq(userRoles.roleId, filters.roleId));
      if (tenantId) {
        whereConditions.push(eq(userRoles.tenantId, tenantId));
      }
    }

    query = query.where(and(...whereConditions)) as any;

    const direction = filters.orderDirection === "asc" ? "asc" : "desc";
    let orderColumn = sql`${platformUsers.createdAt}`;
    if (filters.orderBy === "email") orderColumn = sql`${platformUsers.email}`;
    if (filters.orderBy === "firstName") orderColumn = sql`${platformUsers.firstName}`;
    if (filters.orderBy === "lastName") orderColumn = sql`${platformUsers.lastName}`;

    query = query
      .limit(pageSize)
      .offset(offset)
      .orderBy(sql`${orderColumn} ${sql.raw(direction)}`) as any;

    return await query;
  }

  async count(
    tenantId: string | null,
    filters: { search?: string; status?: string; roleId?: string } = {}
  ) {
    let query = db
      .select({ count: sql<number>`count(distinct ${platformUsers.id})` })
      .from(platformUsers);

    if (tenantId) {
      query = query.innerJoin(tenantUsers, eq(tenantUsers.userId, platformUsers.id)) as any;
    }

    const whereConditions: any[] = [isNull(platformUsers.deletedAt)];
    if (tenantId) {
      whereConditions.push(eq(tenantUsers.tenantId, tenantId));
      whereConditions.push(isNull(tenantUsers.deletedAt));
    }

    if (filters.search) {
      const searchPattern = `%${filters.search.toLowerCase()}%`;
      whereConditions.push(
        sql`(${platformUsers.email} ILIKE ${searchPattern} OR ${platformUsers.firstName} ILIKE ${searchPattern} OR ${platformUsers.lastName} ILIKE ${searchPattern} OR ${platformUsers.displayName} ILIKE ${searchPattern})`
      );
    }

    if (filters.status) {
      if (tenantId) {
        whereConditions.push(eq(tenantUsers.status, filters.status));
      } else {
        whereConditions.push(eq(platformUsers.status, filters.status));
      }
    }

    if (filters.roleId) {
      query = query.innerJoin(userRoles, and(eq(userRoles.userId, platformUsers.id), isNull(userRoles.revokedAt))) as any;
      whereConditions.push(eq(userRoles.roleId, filters.roleId));
      if (tenantId) {
        whereConditions.push(eq(userRoles.tenantId, tenantId));
      }
    }

    query = query.where(and(...whereConditions)) as any;

    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async createGlobal(data: CreateUserInput & { passwordHash: string }) {
    const [newPlatformUser] = await db
      .insert(platformUsers)
      .values({
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.displayName || `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        locale: data.locale,
        timezone: data.timezone,
      })
      .returning();
    return newPlatformUser;
  }

  async createInTenant(
    tenantId: string,
    data: CreateUserInput & { passwordHash: string; defaultRoleId: string }
  ) {
    return await db.transaction(async (tx) => {
      // 1. Obtener o crear el usuario global de plataforma
      let user = await tx
        .select()
        .from(platformUsers)
        .where(eq(platformUsers.email, data.email.toLowerCase()))
        .limit(1)
        .then((res) => res[0]);

      if (!user) {
        [user] = await tx
          .insert(platformUsers)
          .values({
            email: data.email.toLowerCase(),
            passwordHash: data.passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: data.displayName || `${data.firstName} ${data.lastName}`,
            phone: data.phone,
            locale: data.locale,
            timezone: data.timezone,
          })
          .returning();
      } else {
        // Si ya existe, validar que no tenga membresía en este tenant
        const existingMembership = await tx
          .select()
          .from(tenantUsers)
          .where(
            and(
              eq(tenantUsers.userId, user.id),
              eq(tenantUsers.tenantId, tenantId),
              isNull(tenantUsers.deletedAt)
            )
          )
          .limit(1)
          .then((res) => res[0]);

        if (existingMembership) {
          throw new Error("MEMBER_ALREADY_EXISTS");
        }
      }

      // 2. Crear membresía en tenant_users
      await tx.insert(tenantUsers).values({
        tenantId,
        userId: user.id,
        status: "ACTIVE",
        isOwner: false,
        joinedAt: new Date(),
      });

      // 3. Asignar rol
      await tx.insert(userRoles).values({
        tenantId,
        userId: user.id,
        roleId: data.roleId || data.defaultRoleId,
      });

      return user;
    });
  }

  async update(id: string, tenantId: string | null, data: UpdateUserInput) {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const updateData: any = { ...data };
    updateData.updatedAt = new Date();

    const results = await db
      .update(platformUsers)
      .set(updateData)
      .where(and(eq(platformUsers.id, id), isNull(platformUsers.deletedAt)))
      .returning();
    return results[0] || null;
  }

  async delete(id: string, tenantId: string | null) {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return await db.transaction(async (tx) => {
      // Borrado lógico de membresía si aplica
      if (tenantId) {
        await tx
          .update(tenantUsers)
          .set({ deletedAt: new Date(), status: "DISABLED" })
          .where(and(eq(tenantUsers.userId, id), eq(tenantUsers.tenantId, tenantId)));
      }

      // Borrado lógico de usuario global
      const [deletedPlatformUser] = await tx
        .update(platformUsers)
        .set({
          deletedAt: new Date(),
          status: "DISABLED",
        })
        .where(eq(platformUsers.id, id))
        .returning();

      return deletedPlatformUser;
    });
  }

  async updateMembershipStatus(id: string, tenantId: string, status: "ACTIVE" | "DISABLED") {
    const [updated] = await db
      .update(tenantUsers)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(tenantUsers.userId, id), eq(tenantUsers.tenantId, tenantId), isNull(tenantUsers.deletedAt)))
      .returning();
    return updated || null;
  }

  async updatePlatformStatus(id: string, status: "ACTIVE" | "DISABLED") {
    const [updated] = await db
      .update(platformUsers)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(platformUsers.id, id), isNull(platformUsers.deletedAt)))
      .returning();
    return updated || null;
  }

  async getUserSessions(userId: string, tenantId: string | null) {
    const filter = tenantId
      ? and(eq(userSessions.userId, userId), eq(userSessions.tenantId, tenantId), eq(userSessions.status, "ACTIVE"))
      : and(eq(userSessions.userId, userId), eq(userSessions.status, "ACTIVE"));

    return await db
      .select({
        id: userSessions.id,
        accessChannel: userSessions.accessChannel,
        ipAddress: userSessions.ipAddress,
        userAgent: userSessions.userAgent,
        deviceName: userSessions.deviceName,
        lastSeenAt: userSessions.lastSeenAt,
        createdAt: userSessions.createdAt,
      })
      .from(userSessions)
      .where(filter)
      .orderBy(sql`${userSessions.lastSeenAt} desc`);
  }

  async revokeUserSessions(userId: string, tenantId: string | null) {
    const filter = tenantId
      ? and(eq(userSessions.userId, userId), eq(userSessions.tenantId, tenantId), eq(userSessions.status, "ACTIVE"))
      : and(eq(userSessions.userId, userId), eq(userSessions.status, "ACTIVE"));

    return await db
      .update(userSessions)
      .set({
        status: "REVOKED",
        revokedAt: new Date(),
        revokeReason: "Revocado administrativamente por un administrador.",
      })
      .where(filter)
      .returning();
  }

  async assignUserRoles(userId: string, tenantId: string, roleIds: string[]) {
    return await db.transaction(async (tx) => {
      // 1. Revocar los roles actuales en este tenant
      await tx
        .update(userRoles)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.tenantId, tenantId),
            isNull(userRoles.revokedAt)
          )
        );

      // 2. Insertar nuevos roles
      await tx
        .insert(userRoles)
        .values(
          roleIds.map((rId) => ({
            userId,
            tenantId,
            roleId: rId,
          }))
        );
    });
  }

  async countActiveTenantAdmins(tenantId: string) {
    const result = await db
      .select({ count: sql<number>`count(distinct ${tenantUsers.userId})` })
      .from(tenantUsers)
      .innerJoin(userRoles, and(eq(userRoles.userId, tenantUsers.userId), eq(userRoles.tenantId, tenantId)))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(tenantUsers.tenantId, tenantId),
          eq(tenantUsers.status, "ACTIVE"),
          isNull(tenantUsers.deletedAt),
          eq(roles.code, "TENANT_ADMIN"),
          isNull(roles.deletedAt),
          isNull(userRoles.revokedAt)
        )
      );
    return Number(result[0]?.count || 0);
  }
}
