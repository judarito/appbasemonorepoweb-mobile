import { Hono } from "hono";
import { requireAuth } from "../../middlewares/auth";
import { tenantContext } from "../../middlewares/tenant";
import { db } from "../../database/db";
import { tenants } from "../../database/schema";
import { eq, and, isNull } from "drizzle-orm";

const router = new Hono<{ Variables: { traceId: string } }>();

router.use("*", requireAuth);
router.use("*", tenantContext);

// 1. GET /me/permissions
router.get("/permissions", async (c) => {
  const user = c.get("user" as any);
  return c.json({
    success: true,
    data: {
      permissions: user.permissions || [],
    },
    meta: null,
    traceId: c.get("traceId" as any),
  });
});

// 2. GET /me/context
router.get("/context", async (c) => {
  const user = c.get("user" as any);
  const tenantId = c.get("tenantId" as any) as string | null;

  let tenantDetails = null;
  if (tenantId) {
    tenantDetails = await db
      .select({
        id: tenants.id,
        code: tenants.code,
        slug: tenants.slug,
        displayName: tenants.displayName,
        legalName: tenants.legalName,
        logoUrl: tenants.logoUrl,
        primaryColor: tenants.primaryColor,
        status: tenants.status,
      })
      .from(tenants)
      .where(and(eq(tenants.id, tenantId), isNull(tenants.deletedAt)))
      .limit(1)
      .then((res) => res[0] || null);
  }

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        metadata: user.metadata,
      },
      tenant: tenantDetails,
      roles: user.roles || [],
      permissions: user.permissions || [],
    },
    meta: null,
    traceId: c.get("traceId" as any),
  });
});

export const meRoutes = router;
