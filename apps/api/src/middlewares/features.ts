import type { Context, Next } from "hono";
import { FeaturesService } from "../modules/features/features.service";
import { ForbiddenError, UnauthorizedError } from "../common/errors";

const featuresService = new FeaturesService();

/**
 * Middleware para requerir que el inquilino (tenant) tenga una característica activa.
 */
export const requireFeature = (featureCode: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user" as any);
    if (!user) {
      throw new UnauthorizedError("Acceso denegado: Usuario no autenticado.");
    }

    const tenantId = c.get("tenantId" as any) as string | null;

    // Si el usuario es SUPER_ADMIN, se le permite el acceso sin validar la característica
    const isSuperAdmin = user.roles.includes("SUPER_ADMIN");
    if (isSuperAdmin) {
      await next();
      return;
    }

    const hasFeature = await featuresService.hasFeature(tenantId, featureCode);
    if (!hasFeature) {
      throw new ForbiddenError(
        `Acceso denegado: El inquilino actual no tiene activa la característica '${featureCode}' en su plan.`
      );
    }

    await next();
  };
};
