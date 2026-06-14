import { Hono } from "hono";
import { settingsController } from "./settings.controller";
import { requireAuth } from "../../middlewares/auth";
import { tenantContext } from "../../middlewares/tenant";

const router = new Hono();

// El endpoint público no requiere token de sesión
router.get("/public", (c) => settingsController.getPublicSettings(c));

// Las demás rutas sí lo requieren
router.get("/", requireAuth, tenantContext, (c) => settingsController.getSettings(c));
router.put("/", requireAuth, tenantContext, (c) => settingsController.updateSettings(c));

export const settingsRoutes = router;
