import { Hono } from "hono";
import { NotificationsController } from "./notifications.controller";
import { requireAuth } from "../../middlewares/auth";
import { tenantContext } from "../../middlewares/tenant";

const router = new Hono<{ Variables: { traceId: string } }>();
const controller = new NotificationsController();

router.use("*", requireAuth);
router.use("*", tenantContext);

router.get("/", controller.getNotifications);
router.get("/preferences", controller.getUserPreferences);
router.put("/preferences", controller.updateUserPreferences);
router.patch("/:id/read", controller.markAsRead);
router.post("/read-all", controller.markAllAsRead);

export const notificationsRoutes = router;

