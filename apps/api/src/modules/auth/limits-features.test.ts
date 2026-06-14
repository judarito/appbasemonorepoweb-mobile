import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Hono } from "hono";
import { db } from "../../database/db";
import { features, tenantFeatures, plans, planFeatures, subscriptions } from "../../database/schema";
import { eq, inArray } from "drizzle-orm";
import { FeaturesService } from "../features/features.service";
import { requireFeature } from "../../middlewares/features";
import { errorHandler } from "../../middlewares/error";
import { featureCache } from "../../common/cache.service";
import { createTestContext, createTenantHelper, cleanUpTestEntities } from "../../common/test-helpers";

describe("Tenant Limits and Features Suite", () => {
  const ctx = createTestContext();
  const featuresService = new FeaturesService();

  let tenant: any;
  let featureCatalogId: string;
  let featureCode = "TEST_FEATURE_X";

  // Estructuras para limpieza local en este test
  let planId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    // Limpiar previo en caso de ejecuciones anteriores
    await db.delete(features).where(eq(features.code, featureCode));

    // 1. Crear Tenant de prueba
    tenant = await createTenantHelper(ctx, "LIMIT_TEST");

    // 2. Insertar Feature en catálogo global
    const [feat] = await db
      .insert(features)
      .values({
        code: featureCode,
        name: "Test Feature X",
        defaultValue: false, // Por defecto inhabilitado
      })
      .returning();
    
    featureCatalogId = feat.id;
    ctx.permissionIds.push(featureCatalogId); // Se agregará al cleanup global para borrarlo al final
  });

  afterAll(async () => {
    // Limpieza de suscripciones y planes insertados localmente
    if (subscriptionId) {
      await db.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));
    }
    if (planId) {
      await db.delete(plans).where(eq(plans.id, planId));
    }
    if (featureCatalogId) {
      await db.delete(tenantFeatures).where(eq(tenantFeatures.featureId, featureCatalogId));
    }
    await cleanUpTestEntities(ctx);
  });

  test("Debería retornar el valor por defecto si no hay override ni suscripción activa", async () => {
    featureCache.invalidatePrefix(`tenant:${tenant.id}:feature:`);
    // Por defecto es false
    const hasFeature = await featuresService.hasFeature(tenant.id, featureCode);
    expect(hasFeature).toBe(false);
  });

  test("Debería respetar el plan de la suscripción activa si no hay override", async () => {
    featureCache.invalidatePrefix(`tenant:${tenant.id}:feature:`);
    // 1. Crear un Plan
    const [plan] = await db
      .insert(plans)
      .values({
        code: "TEST_PLAN",
        name: "Test Plan",
      })
      .returning();
    planId = plan.id;

    // 2. Asociar Feature habilitada al Plan
    await db
      .insert(planFeatures)
      .values({
        planId: planId,
        featureId: featureCatalogId,
        enabled: true,
      });

    // 3. Crear Suscripción activa para el Tenant
    const [sub] = await db
      .insert(subscriptions)
      .values({
        tenantId: tenant.id,
        planId: planId,
        status: "ACTIVE",
      })
      .returning();
    subscriptionId = sub.id;

    const hasFeature = await featuresService.hasFeature(tenant.id, featureCode);
    expect(hasFeature).toBe(true);
  });

  test("Debería prevalecer el override específico de tenant sobre el plan y catálogo", async () => {
    featureCache.invalidatePrefix(`tenant:${tenant.id}:feature:`);
    // Crear un override para deshabilitar la característica solo para este tenant
    await db
      .insert(tenantFeatures)
      .values({
        tenantId: tenant.id,
        featureId: featureCatalogId,
        enabled: false,
      });

    const hasFeature = await featuresService.hasFeature(tenant.id, featureCode);
    expect(hasFeature).toBe(false);
  });

  test("El middleware requireFeature debería bloquear peticiones si la característica está inactiva", async () => {
    // Configurar Hono app simulada
    const testApp = new Hono<{ Variables: { user?: any; tenantId?: string | null } }>();
    testApp.onError(errorHandler());
    
    testApp.use("*", async (c, next) => {
      c.set("user", { id: "test-user-id", roles: ["MEMBER"] });
      c.set("tenantId", tenant.id);
      await next();
    });

    testApp.get("/protected-route", requireFeature(featureCode), (c) => c.json({ success: true }));

    const res = await testApp.request("/protected-route");
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toContain("no tiene activa la característica");
  });

  test("El middleware requireFeature debería permitir peticiones si la característica está activa", async () => {
    featureCache.invalidatePrefix(`tenant:${tenant.id}:feature:`);
    // Actualizar override a habilitado
    await db
      .update(tenantFeatures)
      .set({ enabled: true })
      .where(eq(tenantFeatures.tenantId, tenant.id));

    const testApp = new Hono<{ Variables: { user?: any; tenantId?: string | null } }>();
    testApp.onError(errorHandler());
    
    testApp.use("*", async (c, next) => {
      c.set("user", { id: "test-user-id", roles: ["MEMBER"] });
      c.set("tenantId", tenant.id);
      await next();
    });

    testApp.get("/protected-route", requireFeature(featureCode), (c) => c.json({ success: true }));

    const res = await testApp.request("/protected-route");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test("El middleware requireFeature debería permitir peticiones a SUPER_ADMIN incluso si la característica está inactiva", async () => {
    // Inhabilitar característica nuevamente
    await db
      .update(tenantFeatures)
      .set({ enabled: false })
      .where(eq(tenantFeatures.tenantId, tenant.id));

    const testApp = new Hono<{ Variables: { user?: any; tenantId?: string | null } }>();
    testApp.onError(errorHandler());
    
    testApp.use("*", async (c, next) => {
      // Usuario es SUPER_ADMIN
      c.set("user", { id: "test-user-id", roles: ["SUPER_ADMIN"] });
      c.set("tenantId", tenant.id);
      await next();
    });

    testApp.get("/protected-route", requireFeature(featureCode), (c) => c.json({ success: true }));

    const res = await testApp.request("/protected-route");
    expect(res.status).toBe(200);
  });
});
