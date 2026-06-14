import { db } from "../../database/db";
import { tenantFeatures, features, subscriptions, planFeatures } from "../../database/schema";
import { eq, and, isNull, or, sql } from "drizzle-orm";
import { featureCache } from "../../common/cache.service";

export class FeaturesService {
  /**
   * Determina si un inquilino tiene una característica (feature) habilitada.
   * Resuelve en cascada:
   * 1. Overrides específicos de tenant (`tenant_features`).
   * 2. Características del plan de suscripción activo (`plan_features` vía `subscriptions`).
   * 3. Valor por defecto del catálogo de características (`features`).
   *
   * Utiliza caché en memoria (LRU) con TTL de 5 minutos para evitar
   * 3 queries en cada request que usa el middleware `requireFeature`.
   */
  async hasFeature(tenantId: string | null, featureCode: string): Promise<boolean> {
    const cacheKey = `tenant:${tenantId ?? "global"}:feature:${featureCode.toLowerCase()}`;

    // 1. Intentar resolver desde caché
    const cached = featureCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const result = await this.resolveFeature(tenantId, featureCode);

    // Guardar en caché (TTL por defecto: 5 minutos)
    featureCache.set(cacheKey, result);

    return result;
  }

  /**
   * Invalida el caché de features para un tenant específico.
   * Debe llamarse al actualizar tenant_features o cambiar de plan.
   */
  invalidateTenantCache(tenantId: string): void {
    featureCache.invalidatePrefix(`tenant:${tenantId}:feature:`);
  }

  private async resolveFeature(tenantId: string | null, featureCode: string): Promise<boolean> {
    if (!tenantId) {
      return await this.getDefaultFeatureValue(featureCode);
    }

    const featureCodeLower = featureCode.toLowerCase();

    // 1. Buscar override específico en tenant_features
    const tenantOverride = await db
      .select({
        enabled: tenantFeatures.enabled,
        validUntil: tenantFeatures.validUntil,
      })
      .from(tenantFeatures)
      .innerJoin(features, eq(tenantFeatures.featureId, features.id))
      .where(
        and(
          eq(tenantFeatures.tenantId, tenantId),
          eq(sql`lower(${features.code})`, featureCodeLower)
        )
      )
      .limit(1)
      .then((res) => res[0]);

    if (tenantOverride) {
      const isValid = !tenantOverride.validUntil || new Date(tenantOverride.validUntil) > new Date();
      if (isValid) {
        return tenantOverride.enabled;
      }
    }

    // 2. Buscar suscripción activa y su plan_features
    const planFeatureMapping = await db
      .select({
        enabled: planFeatures.enabled,
      })
      .from(subscriptions)
      .innerJoin(planFeatures, eq(subscriptions.planId, planFeatures.planId))
      .innerJoin(features, eq(planFeatures.featureId, features.id))
      .where(
        and(
          eq(subscriptions.tenantId, tenantId),
          or(
            eq(subscriptions.status, "ACTIVE"),
            eq(subscriptions.status, "TRIALING"),
            eq(subscriptions.status, "GRACE_PERIOD")
          ),
          isNull(subscriptions.deletedAt),
          eq(sql`lower(${features.code})`, featureCodeLower)
        )
      )
      .limit(1)
      .then((res) => res[0]);

    if (planFeatureMapping) {
      return planFeatureMapping.enabled;
    }

    // 3. Caer al valor por defecto del catálogo
    return await this.getDefaultFeatureValue(featureCode);
  }

  private async getDefaultFeatureValue(featureCode: string): Promise<boolean> {
    const feature = await db
      .select({
        defaultValue: features.defaultValue,
      })
      .from(features)
      .where(eq(sql`lower(${features.code})`, featureCode.toLowerCase()))
      .limit(1)
      .then((res) => res[0]);

    if (!feature) return false;

    // Convertir defaultValue (jsonb) a boolean si es posible
    if (typeof feature.defaultValue === "boolean") {
      return feature.defaultValue;
    }
    if (typeof feature.defaultValue === "string") {
      return feature.defaultValue.toLowerCase() === "true";
    }
    return !!feature.defaultValue;
  }
}
