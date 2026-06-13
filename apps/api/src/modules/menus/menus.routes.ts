import { Hono } from "hono";
import { MenusController } from "./menus.controller";
import { requireAuth, requirePermission } from "../../middlewares/auth";
import { tenantContext } from "../../middlewares/tenant";

const router = new Hono<{ Variables: { traceId: string } }>();
const controller = new MenusController();

router.use("*", requireAuth);
router.use("*", tenantContext);

router.get("/", requirePermission("menus.read"), controller.getMenus);
router.get("/:id", requirePermission("menus.read"), controller.getMenu);
router.post("/", requirePermission("menus.create"), controller.createMenu);
router.patch("/:id", requirePermission("menus.update"), controller.updateMenu);
router.delete("/:id", requirePermission("menus.delete"), controller.deleteMenu);

router.post("/:id/roles", requirePermission("menus.update"), controller.associateRoles);
router.get("/:id/roles", requirePermission("menus.read"), controller.getAssociatedRoles);

export const menusRoutes = router;
