import type { Context } from "hono";
import { SettingsService } from "./settings.service";
import { ForbiddenError, NotFoundError } from "../../common/errors";
import { resolveTenantForPublicRequest } from "./settings.resolver";

const settingsService = new SettingsService();

export class SettingsController {
  // GET /api/v1/settings/public
  async getPublicSettings(c: Context) {
    const host = c.req.header("host") || "";
    const headerTenantId = c.req.header("x-tenant-id");
    const headerTenantCode = c.req.header("x-tenant-code");

    // Resolver el tenant context
    const tenant = await resolveTenantForPublicRequest(host, headerTenantId, headerTenantCode);

    if (!tenant) {
      // Retornar catálogo base por defecto si no hay contexto de tenant
      const defaultPublic = await settingsService.getSettingsForTenant("00000000-0000-0000-0000-000000000000", true);
      return c.json({
        success: true,
        data: {
          tenant: null,
          settings: defaultPublic,
        },
      });
    }

    const settings = await settingsService.getSettingsForTenant(tenant.id, true);

    return c.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          code: tenant.code,
          name: tenant.displayName,
          slug: tenant.slug,
        },
        settings,
      },
    });
  }

  // GET /api/v1/settings
  async getSettings(c: Context) {
    const tenantId = c.get("tenantId" as any);
    const user = c.get("user" as any);

    // Superadmin sin contexto de tenant: devolver catálogo base por defecto
    if (!tenantId) {
      if (user.roles.includes("SUPER_ADMIN")) {
        const settings = await settingsService.getSettingsForTenant("00000000-0000-0000-0000-000000000000", false);
        return c.json({
          success: true,
          data: settings,
        });
      }
      throw new ForbiddenError("Debe especificar un contexto de inquilino.");
    }

    // Validar rol de administrador o permiso de lectura
    const hasAccess =
      user.roles.includes("SUPER_ADMIN") ||
      user.roles.includes("ADMIN") ||
      user.roles.includes("TENANT_ADMIN") ||
      user.permissions.includes("settings.read") ||
      user.permissions.includes("settings.update");

    if (!hasAccess) {
      throw new ForbiddenError("No tienes permisos para ver la configuración del inquilino.");
    }

    const settings = await settingsService.getSettingsForTenant(tenantId, false);

    return c.json({
      success: true,
      data: settings,
    });
  }

  // PUT /api/v1/settings
  async updateSettings(c: Context) {
    const tenantId = c.get("tenantId" as any);
    const user = c.get("user" as any);

    if (!tenantId) {
      if (user.roles.includes("SUPER_ADMIN")) {
        throw new ForbiddenError("Debe seleccionar un inquilino para guardar la configuración global.");
      }
      throw new ForbiddenError("Debe especificar un contexto de inquilino.");
    }

    // Validar permisos
    const hasAccess =
      user.roles.includes("SUPER_ADMIN") ||
      user.roles.includes("ADMIN") ||
      user.roles.includes("TENANT_ADMIN") ||
      user.permissions.includes("settings.update");

    if (!hasAccess) {
      throw new ForbiddenError("No tienes permisos para actualizar la configuración del inquilino.");
    }

    const body = await c.req.json();
    const { settings } = body;

    const result = await settingsService.updateSettings(tenantId, settings, user.id);

    return c.json({
      success: true,
      data: result,
    });
  }
}
export const settingsController = new SettingsController();
