import { MenusRepository } from "./menus.repository";
import type { CreateMenuInput, UpdateMenuInput } from "./menus.schema";
import { ConflictError, NotFoundError } from "../../common/errors";
import { db } from "../../database/db";
import { tenantFeatures, features } from "../../database/schema";
import { eq, and, isNull, or, sql } from "drizzle-orm";
import { menuCache } from "../../common/cache.service";

export interface MenuItemNode {
  id: string;
  parentId: string | null;
  code: string;
  label: string;
  description: string | null;
  route: string | null;
  icon: string | null;
  sortOrder: number;
  platform: string;
  isVisible: boolean;
  isActive: boolean;
  children?: MenuItemNode[];
}

export class MenusService {
  private repository = new MenusRepository();

  async getMenu(id: string, tenantId: string | null) {
    const menu = await this.repository.findById(id, tenantId);
    if (!menu) {
      throw new NotFoundError(`Menú con ID '${id}' no encontrado.`);
    }
    return menu;
  }

  async getMenus(tenantId: string | null, platform?: "WEB" | "MOBILE" | "BOTH") {
    return await this.repository.findMany(tenantId, platform);
  }

  async createMenu(tenantId: string | null, data: CreateMenuInput) {
    // Validar ruta duplicada si está definida
    if (data.route) {
      const duplicate = await this.repository.findByRoute(data.route, tenantId, data.platform);
      if (duplicate) {
        throw new ConflictError(`La ruta '${data.route}' ya está configurada para esta plataforma.`);
      }
    }

    const menu = await this.repository.create(tenantId, data);
    if (tenantId) menuCache.invalidatePrefix(`tenant:${tenantId}:menus`);
    return menu;
  }

  async updateMenu(id: string, tenantId: string | null, data: UpdateMenuInput) {
    const existing = await this.getMenu(id, tenantId);

    // Validar ruta duplicada si se está actualizando la ruta o plataforma
    const targetRoute = data.route !== undefined ? data.route : existing.route;
    const targetPlatform = data.platform !== undefined ? data.platform : existing.platform;

    if (targetRoute) {
      const duplicate = await this.repository.findByRoute(targetRoute, tenantId, targetPlatform as any, id);
      if (duplicate) {
        throw new ConflictError(`La ruta '${targetRoute}' ya está configurada para esta plataforma.`);
      }
    }


    const updated = await this.repository.update(id, tenantId, data);
    if (tenantId) menuCache.invalidatePrefix(`tenant:${tenantId}:menus`);
    return updated;
  }

  async deleteMenu(id: string, tenantId: string | null) {
    await this.getMenu(id, tenantId);
    const result = await this.repository.delete(id, tenantId);
    if (tenantId) menuCache.invalidatePrefix(`tenant:${tenantId}:menus`);
    return result;
  }

  async associateRoles(menuId: string, tenantId: string | null, roleIds: string[]) {
    await this.getMenu(menuId, tenantId);
    await this.repository.associateRoles(menuId, roleIds);
    return { success: true };
  }

  async getAssociatedRoles(menuId: string, tenantId: string | null) {
    await this.getMenu(menuId, tenantId);
    return await this.repository.getAssociatedRoles(menuId);
  }

  async getUserMenuTree(
    userId: string,
    tenantId: string | null,
    platform?: "WEB" | "MOBILE" | "BOTH",
    userPermissions: string[] = []
  ): Promise<MenuItemNode[]> {
    // Cache key incluye userId para que cada usuario vea su propia vista de menús
    const cacheKey = `tenant:${tenantId ?? "global"}:menus:${userId}:${platform ?? "ALL"}`;
    const cached = menuCache.get(cacheKey);
    if (cached) return cached as MenuItemNode[];

    // 1. Obtener ítems candidatos asociados a roles del usuario
    const rawItems = await this.repository.getMenuItemsForUser(userId, tenantId, platform);

    // 2. Resolver features habilitadas si estamos en contexto de tenant
    const enabledFeatures = new Set<string>();
    if (tenantId) {
      const tenantFeaturesList = await db
        .select({ code: features.code })
        .from(tenantFeatures)
        .innerJoin(features, eq(tenantFeatures.featureId, features.id))
        .where(
          and(
            eq(tenantFeatures.tenantId, tenantId),
            eq(tenantFeatures.enabled, true),
            or(isNull(tenantFeatures.validUntil), sql`${tenantFeatures.validUntil} > now()`)
          )
        );

      for (const feat of tenantFeaturesList) {
        enabledFeatures.add(feat.code.toLowerCase());
      }
    }

    const permissionSet = new Set(userPermissions.map((p) => p.toLowerCase()));

    // 3. Filtrar según permisos requeridos y features habilitadas
    const filteredItems = rawItems.filter((item) => {
      // Filtrar por permisos
      if (item.requiredPermissionCode) {
        if (!permissionSet.has(item.requiredPermissionCode.toLowerCase())) {
          return false;
        }
      }

      // Filtrar por features
      if (item.requiredFeatureCode) {
        if (!enabledFeatures.has(item.requiredFeatureCode.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // 4. Construir árbol recursivamente y cachear el resultado
    const tree = this.buildMenuTree(filteredItems, null);
    menuCache.set(cacheKey, tree);
    return tree;
  }

  private buildMenuTree(items: any[], parentId: string | null): MenuItemNode[] {
    const nodes: MenuItemNode[] = [];

    const levelItems = items.filter((item) => item.parentId === parentId);
    for (const item of levelItems) {
      const node: MenuItemNode = {
        id: item.id,
        parentId: item.parentId,
        code: item.code,
        label: item.label,
        description: item.description,
        route: item.route,
        icon: item.icon,
        sortOrder: item.sortOrder,
        platform: item.platform,
        isVisible: item.isVisible,
        isActive: item.isActive,
      };

      const children = this.buildMenuTree(items, item.id);
      if (children.length > 0) {
        node.children = children;
      }

      nodes.push(node);
    }

    // Ordenar de forma ascendente según sortOrder
    return nodes.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
