import { Hono } from "hono";
import { UsersController } from "./users.controller";
import { requireAuth, requirePermission } from "../../middlewares/auth";
import { tenantContext } from "../../middlewares/tenant";

const router = new Hono<{ Variables: { traceId: string } }>();
const controller = new UsersController();

// Todas las rutas de usuarios requieren estar autenticado y en el contexto de su tenant
router.use("*", requireAuth);
router.use("*", tenantContext);

router.get("/", requirePermission("users.read"), controller.getUsers);
router.get("/:id", requirePermission("users.read"), controller.getUser);
router.post("/", requirePermission("users.create"), controller.createUser);
router.patch("/:id", requirePermission("users.update"), controller.updateUser);
router.delete("/:id", requirePermission("users.delete"), controller.deleteUser);

export const usersRoutes = router;
