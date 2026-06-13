import { Hono } from "hono";
import { RolesController } from "./roles.controller";
import { requireAuth, requirePermission } from "../../middlewares/auth";
import { tenantContext } from "../../middlewares/tenant";

const router = new Hono<{ Variables: { traceId: string } }>();
const controller = new RolesController();

// Todas las rutas de roles requieren autenticación y contexto de tenant
router.use("*", requireAuth);
router.use("*", tenantContext);

router.get("/", requirePermission("roles.read"), controller.getRoles);
router.get("/:id", requirePermission("roles.read"), controller.getRole);
router.post("/", requirePermission("roles.create"), controller.createRole);
router.patch("/:id", requirePermission("roles.update"), controller.updateRole);
router.delete("/:id", requirePermission("roles.delete"), controller.deleteRole);

export const rolesRoutes = router;
