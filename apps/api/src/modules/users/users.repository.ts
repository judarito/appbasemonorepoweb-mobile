import { db } from "../../database/db";
import { platformUsers } from "../../database/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import type { CreateUserInput, UpdateUserInput } from "./users.schema";

export class UsersRepository {
  async findById(id: string) {
    const results = await db
      .select()
      .from(platformUsers)
      .where(and(eq(platformUsers.id, id), isNull(platformUsers.deletedAt)))
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

  async findMany(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    return await db
      .select()
      .from(platformUsers)
      .where(isNull(platformUsers.deletedAt))
      .limit(pageSize)
      .offset(offset)
      .orderBy(sql`${platformUsers.createdAt} desc`);
  }

  async count() {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(platformUsers)
      .where(isNull(platformUsers.deletedAt));
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

  async update(id: string, data: UpdateUserInput) {
    const updateData: any = { ...data };
    updateData.updatedAt = new Date();

    const results = await db
      .update(platformUsers)
      .set(updateData)
      .where(and(eq(platformUsers.id, id), isNull(platformUsers.deletedAt)))
      .returning();
    return results[0] || null;
  }

  async delete(id: string) {
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
