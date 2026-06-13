import { db } from "../../database/db";
import { roles, rolePermissions, permissions } from "../../database/schema";
import { eq, and, isNull, sql, inArray } from "drizzle-orm";
import type { CreateRoleInput, UpdateRoleInput } from "./roles.schema";

export class RolesRepository {
  async findById(id: string, tenantId: string | null) {
    const filter = tenantId 
      ? and(eq(roles.id, id), eq(roles.tenantId, tenantId), isNull(roles.deletedAt))
      : and(eq(roles.id, id), isNull(roles.deletedAt));

    const result = await db
      .select()
      .from(roles)
      .where(filter)
      .limit(1)
      .then((res) => res[0]);

    return result || null;
  }

  async findByCode(code: string, tenantId: string | null) {
    const filter = tenantId 
      ? and(eq(roles.code, code.toUpperCase()), eq(roles.tenantId, tenantId), isNull(roles.deletedAt))
      : and(eq(roles.code, code.toUpperCase()), isNull(roles.deletedAt));

    const result = await db
      .select()
      .from(roles)
      .where(filter)
      .limit(1)
      .then((res) => res[0]);

    return result || null;
  }

  async findMany(tenantId: string | null, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const filter = tenantId
      ? and(eq(roles.tenantId, tenantId), isNull(roles.deletedAt))
      : isNull(roles.deletedAt);

    return await db
      .select()
      .from(roles)
      .where(filter)
      .limit(pageSize)
      .offset(offset)
      .orderBy(sql`${roles.createdAt} asc`);
  }

  async count(tenantId: string | null) {
    const filter = tenantId
      ? and(eq(roles.tenantId, tenantId), isNull(roles.deletedAt))
      : isNull(roles.deletedAt);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(roles)
      .where(filter);

    return Number(result[0]?.count || 0);
  }

  async getRolePermissions(roleId: string) {
    const results = await db
      .select({
        id: permissions.id,
        code: permissions.code,
        name: permissions.name,
        resource: permissions.resource,
        action: permissions.action,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    return results;
  }

  async create(data: CreateRoleInput & { tenantId: string | null }) {
    return await db.transaction(async (tx) => {
      // 1. Insertar el rol
      const [newRole] = await tx
        .insert(roles)
        .values({
          tenantId: data.tenantId,
          code: data.code.toUpperCase(),
          name: data.name,
          description: data.description,
          scope: data.tenantId ? "TENANT" : "PLATFORM",
          isSystem: false,
          isDefault: false,
        })
        .returning();

      // 2. Vincular los permisos si se proveen
      if (data.permissionIds && data.permissionIds.length > 0) {
        await tx
          .insert(rolePermissions)
          .values(
            data.permissionIds.map((pId) => ({
              roleId: newRole.id,
              permissionId: pId,
            }))
          );
      }

      return newRole;
    });
  }

  async update(id: string, tenantId: string | null, data: UpdateRoleInput) {
    return await db.transaction(async (tx) => {
      const filter = tenantId
        ? and(eq(roles.id, id), eq(roles.tenantId, tenantId), isNull(roles.deletedAt))
        : and(eq(roles.id, id), isNull(roles.deletedAt));

      // 1. Actualizar campos del rol
      const updateFields: any = {};
      if (data.name !== undefined) updateFields.name = data.name;
      if (data.description !== undefined) updateFields.description = data.description;
      updateFields.updatedAt = new Date();

      const [updatedRole] = await tx
        .update(roles)
        .set(updateFields)
        .where(filter)
        .returning();

      if (!updatedRole) return null;

      // 2. Si se suministran permisos, sincronizar
      if (data.permissionIds !== undefined) {
        // Eliminar permisos existentes
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

        // Insertar nuevos permisos
        if (data.permissionIds.length > 0) {
          await tx
            .insert(rolePermissions)
            .values(
              data.permissionIds.map((pId) => ({
                roleId: id,
                permissionId: pId,
              }))
            );
        }
      }

      return updatedRole;
    });
  }

  async delete(id: string, tenantId: string | null) {
    const filter = tenantId
      ? and(eq(roles.id, id), eq(roles.tenantId, tenantId))
      : eq(roles.id, id);

    const [deletedRole] = await db
      .update(roles)
      .set({ deletedAt: new Date() })
      .where(filter)
      .returning();

    return deletedRole || null;
  }
}
