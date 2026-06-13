import { db } from "../../database/db";
import { platformUsers, tenantUsers } from "../../database/schema";
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

  async findMany(tenantId: string | null, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    if (!tenantId) {
      return await db
        .select()
        .from(platformUsers)
        .where(isNull(platformUsers.deletedAt))
        .limit(pageSize)
        .offset(offset)
        .orderBy(sql`${platformUsers.createdAt} desc`);
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
          eq(tenantUsers.tenantId, tenantId),
          isNull(tenantUsers.deletedAt),
          isNull(platformUsers.deletedAt)
        )
      )
      .limit(pageSize)
      .offset(offset)
      .orderBy(sql`${platformUsers.createdAt} desc`);

    return results;
  }

  async count(tenantId: string | null) {
    if (!tenantId) {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(platformUsers)
        .where(isNull(platformUsers.deletedAt));
      return Number(result[0]?.count || 0);
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(platformUsers)
      .innerJoin(tenantUsers, eq(tenantUsers.userId, platformUsers.id))
      .where(
        and(
          eq(tenantUsers.tenantId, tenantId),
          isNull(tenantUsers.deletedAt),
          isNull(platformUsers.deletedAt)
        )
      );
    return Number(result[0]?.count || 0);
  }

  async create(data: CreateUserInput & { passwordHash: string }) {
    const results = await db
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
    return results[0];
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

    const results = await db
      .update(platformUsers)
      .set({
        deletedAt: new Date(),
        status: "DISABLED",
      })
      .where(eq(platformUsers.id, id))
      .returning();
    return results[0] || null;
  }
}
