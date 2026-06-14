import { Hono } from "hono";
import { SuperadminController } from "./superadmin.controller";
import { requireAuth, requireRole } from "../../middlewares/auth";

const router = new Hono();
const controller = new SuperadminController();

// Todas las rutas de este módulo requieren estar autenticado y ser SUPER_ADMIN
router.use("*", requireAuth, requireRole("SUPER_ADMIN"));

router.get("/tenants", controller.getTenants);
router.post("/tenants", controller.createTenant);
router.get("/tenants/:id", controller.getTenant);
router.patch("/tenants/:id", controller.updateTenant);
router.post("/tenants/:id/status", controller.updateTenantStatus);
router.get("/tenants/:id/users", controller.getTenantUsers);
router.get("/tenants/:id/usage", controller.getTenantUsage);
router.post("/support/session", controller.createSupportSession);
router.get("/permissions", controller.getPermissions);

// --- PLANS ROUTING ---
router.get("/plans", controller.getPlans);
router.post("/plans", controller.createPlan);
router.get("/plans/:id", controller.getPlan);
router.patch("/plans/:id", controller.updatePlan);
router.delete("/plans/:id", controller.deletePlan);
router.get("/plans/:id/features", controller.getPlanFeatures);
router.post("/plans/:id/features", controller.savePlanFeatures);

// --- FEATURES ROUTING ---
router.get("/features", controller.getFeatures);
router.post("/features", controller.createFeature);
router.get("/features/:id", controller.getFeature);
router.patch("/features/:id", controller.updateFeature);
router.delete("/features/:id", controller.deleteFeature);

// --- TENANT OVERRIDES ---
router.get("/tenants/:id/features", controller.getTenantFeatures);
router.post("/tenants/:id/features", controller.saveTenantFeatures);

// --- AUDIT LOGS ---
router.get("/audit-logs", controller.getAuditLogs);

export { router as superadminRoutes };

