import { db } from "../../database/db";
import { menus, roleMenus, userRoles, roles, permissions } from "../../database/schema";
import { eq, and, isNull, sql, inArray, or } from "drizzle-orm";
import type { CreateMenuInput, UpdateMenuInput } from "./menus.schema";

export class MenusRepository {
  async findById(id: string, tenantId: string | null) {
    const conditions = [eq(menus.id, id), isNull(menus.deletedAt)];
    if (tenantId) {
      conditions.push(or(eq(menus.tenantId, tenantId), isNull(menus.tenantId)) as any);
    } else {
      conditions.push(isNull(menus.tenantId));
    }

    const results = await db
      .select({
        id: menus.id,
        tenantId: menus.tenantId,
        parentId: menus.parentId,
        code: menus.code,
        label: menus.label,
        description: menus.description,
        route: menus.route,
        icon: menus.icon,
        sortOrder: menus.sortOrder,
        platform: menus.platform,
        requiredPermissionId: menus.requiredPermissionId,
        requiredFeatureCode: menus.requiredFeatureCode,
        isVisible: menus.isVisible,
        isActive: menus.isActive,
        metadata: menus.metadata,
        createdAt: menus.createdAt,
        updatedAt: menus.updatedAt,
      })
      .from(menus)
      .where(and(...conditions))
      .limit(1);

    return results[0] || null;
  }

  async findMany(tenantId: string | null, platform?: "WEB" | "MOBILE" | "BOTH") {
    const conditions = [isNull(menus.deletedAt)];
    if (tenantId) {
      conditions.push(or(eq(menus.tenantId, tenantId), isNull(menus.tenantId)) as any);
    } else {
      conditions.push(isNull(menus.tenantId));
    }

    if (platform && platform !== "BOTH") {
      conditions.push(or(eq(menus.platform, platform), eq(menus.platform, "BOTH")) as any);
    }

    return await db
      .select()
      .from(menus)
      .where(and(...conditions))
      .orderBy(menus.sortOrder);
  }

  async create(tenantId: string | null, data: CreateMenuInput) {
    const [newMenu] = await db
      .insert(menus)
      .values({
        tenantId,
        parentId: data.parentId,
        code: data.code,
        label: data.label,
        description: data.description,
        route: data.route,
        icon: data.icon,
        sortOrder: data.sortOrder,
        platform: data.platform,
        requiredPermissionId: data.requiredPermissionId,
        requiredFeatureCode: data.requiredFeatureCode,
        isVisible: data.isVisible,
        isActive: data.isActive,
        metadata: data.metadata,
      })
      .returning();
    return newMenu;
  }

  async update(id: string, tenantId: string | null, data: UpdateMenuInput) {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const [updated] = await db
      .update(menus)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(menus.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, tenantId: string | null) {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const [deleted] = await db
      .update(menus)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(eq(menus.id, id))
      .returning();

    return deleted;
  }

  async findByRoute(route: string, tenantId: string | null, platform: "WEB" | "MOBILE" | "BOTH", excludeId?: string) {
    const conditions = [
      eq(menus.route, route),
      isNull(menus.deletedAt)
    ];

    if (tenantId) {
      conditions.push(or(eq(menus.tenantId, tenantId), isNull(menus.tenantId)) as any);
    } else {
      conditions.push(isNull(menus.tenantId));
    }

    if (platform !== "BOTH") {
      conditions.push(or(eq(menus.platform, platform), eq(menus.platform, "BOTH")) as any);
    }

    if (excludeId) {
      conditions.push(sql`${menus.id} <> ${excludeId}`);
    }

    const results = await db
      .select()
      .from(menus)
      .where(and(...conditions))
      .limit(1);

    return results[0] || null;
  }

  async associateRoles(menuId: string, roleIds: string[]) {
    return await db.transaction(async (tx) => {
      // 1. Eliminar asociaciones anteriores
      await tx.delete(roleMenus).where(eq(roleMenus.menuId, menuId));

      // 2. Insertar nuevas
      if (roleIds.length > 0) {
        await tx.insert(roleMenus).values(
          roleIds.map((rId) => ({
            menuId,
            roleId: rId,
            isVisible: true,
          }))
        );
      }
    });
  }

  async getAssociatedRoles(menuId: string) {
    return await db
      .select({ roleId: roleMenus.roleId })
      .from(roleMenus)
      .where(eq(roleMenus.menuId, menuId));
  }

  async getMenuItemsForUser(userId: string, tenantId: string | null, platform?: "WEB" | "MOBILE" | "BOTH") {
    // 1. Obtener los roles activos del usuario en este tenant (o global si tenantId es null)
    const userRolesList = await db
      .select({ code: roles.code, id: roles.id })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          tenantId ? eq(userRoles.tenantId, tenantId) : isNull(userRoles.tenantId),
          isNull(userRoles.revokedAt)
        )
      );

    const isSuperAdmin = userRolesList.some((r) => r.code === "SUPER_ADMIN");

    // 2. Construir la consulta de menús candidatos
    let query = db
      .select({
        id: menus.id,
        parentId: menus.parentId,
        code: menus.code,
        label: menus.label,
        description: menus.description,
        route: menus.route,
        icon: menus.icon,
        sortOrder: menus.sortOrder,
        platform: menus.platform,
        requiredPermissionId: menus.requiredPermissionId,
        requiredPermissionCode: permissions.code,
        requiredFeatureCode: menus.requiredFeatureCode,
        isVisible: menus.isVisible,
        isActive: menus.isActive,
      })
      .from(menus)
      .leftJoin(permissions, eq(menus.requiredPermissionId, permissions.id));

    const conditions: any[] = [
      eq(menus.isActive, true),
      isNull(menus.deletedAt),
    ];

    if (platform && platform !== "BOTH") {
      conditions.push(or(eq(menus.platform, platform), eq(menus.platform, "BOTH")) as any);
    }

    if (isSuperAdmin) {
      // Superadmin ve todo en el sistema
      query = query.where(and(...conditions)) as any;
    } else {
      // Usuario normal: sólo ve menús asociados a sus roles
      if (userRolesList.length === 0) {
        return [];
      }

      const roleIds = userRolesList.map((r) => r.id);

      // Inner join con role_menus
      query = query.innerJoin(
        roleMenus,
        and(
          eq(roleMenus.menuId, menus.id),
          eq(roleMenus.isVisible, true),
          inArray(roleMenus.roleId, roleIds)
        )
      ) as any;

      // Filtrar que pertenezcan al tenant o sean globales (del sistema)
      if (tenantId) {
        conditions.push(or(eq(menus.tenantId, tenantId), isNull(menus.tenantId)) as any);
      } else {
        conditions.push(isNull(menus.tenantId));
      }

      query = query.where(and(...conditions)) as any;
    }

    const items = await query.orderBy(menus.sortOrder);

    // Deducir duplicados de menús si se asocian por múltiples roles
    const uniqueMap = new Map<string, typeof items[0]>();
    for (const item of items) {
      uniqueMap.set(item.id, item);
    }

    return Array.from(uniqueMap.values());
  }
}
