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

export { router as superadminRoutes };
