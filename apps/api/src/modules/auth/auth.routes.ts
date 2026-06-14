import { Hono } from "hono";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../middlewares/auth";
import { rateLimit } from "../../middlewares/rate-limit";

const router = new Hono<{ Variables: { traceId: string } }>();
const controller = new AuthController();

const loginRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, name: "login" });
const forgotRateLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 3, name: "forgot-password" });

router.post("/login", loginRateLimit, controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", requireAuth, controller.logout);
router.post("/forgot-password", forgotRateLimit, controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

export { loginRateLimit, forgotRateLimit };
export const authRoutes = router;
