import { Hono } from "hono";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../middlewares/auth";

const router = new Hono<{ Variables: { traceId: string } }>();
const controller = new AuthController();

router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", requireAuth, controller.logout);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

export const authRoutes = router;
