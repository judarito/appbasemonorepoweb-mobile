import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { env } from "./config/env";
import { traceMiddleware } from "./middlewares/trace";
import { loggerMiddleware, logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/error";
import { initializeDatabase, db } from "./database/db";
import { sql } from "drizzle-orm";
import { openapiSpec } from "./common/openapi";
import { usersRoutes } from "./modules/users/users.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { rolesRoutes } from "./modules/roles/roles.routes";
import { meRoutes } from "./modules/me/me.routes";
import { menusRoutes } from "./modules/menus/menus.routes";
import { superadminRoutes } from "./modules/superadmin/superadmin.routes";
import { settingsRoutes } from "./modules/settings/settings.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { filesRoutes } from "./modules/files/files.routes";
import { metricsMiddleware } from "./middlewares/metrics";
import { metricsRoutes } from "./modules/metrics/metrics.routes";
import { telemetry } from "./common/telemetry";



export const app = new Hono<{ Variables: { traceId: string } }>();

// Middlewares globales
app.use("*", cors({
  origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",") : ["http://localhost:5173"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization", "x-trace-id", "x-tenant-id", "x-tenant-code"],
  exposeHeaders: ["x-trace-id"],
}));
app.use("*", traceMiddleware());
app.use("*", loggerMiddleware());
app.use("*", metricsMiddleware());

telemetry.initialize();

// Inicializar conexión a BD con resiliencia (reintentos automáticos)
initializeDatabase().catch((err) => {
  logger.error({ msg: "Error fatal al conectar a la base de datos", err: err.message });
  process.exit(1);
});

app.route("/", metricsRoutes);

// Manejo global de errores
app.onError(errorHandler());

// Documentación Swagger (solo desarrollo/staging)
if (env.NODE_ENV !== "production") {
  app.get("/swagger.json", (c) => c.json(openapiSpec));
  app.get("/docs", swaggerUI({ url: "/swagger.json" }));
}

// Endpoint de salud básico (rápido, no toca base de datos)
app.get("/health", (c) => {
  const memory = process.memoryUsage();
  return c.json({
    success: true,
    data: {
      status: "UP",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapTotalBytes: memory.heapTotal,
        heapUsedBytes: memory.heapUsed,
        rssBytes: memory.rss,
      },
      cpu: process.cpuUsage(),
    },
    meta: null,
    traceId: c.get("traceId"),
  });
});

// Endpoint de listo (completo, verifica conexión a base de datos)
app.get("/ready", async (c) => {
  const start = performance.now();
  try {
    await db.execute(sql`SELECT 1`);
    const dbLatencyMs = parseFloat((performance.now() - start).toFixed(2));
    return c.json({
      success: true,
      data: {
        status: "READY",
        database: "CONNECTED",
        databaseLatencyMs: dbLatencyMs,
        timestamp: new Date().toISOString(),
      },
      meta: null,
      traceId: c.get("traceId"),
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error({
      traceId: c.get("traceId"),
      err: errMsg,
      msg: "Database readiness check failed",
    });
    return c.json({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "La base de datos no está lista o no está disponible.",
        details: [error.message],
      },
      traceId: c.get("traceId"),
    }, 503);
  }
});

// Grupo de rutas API v1
const v1 = new Hono<{ Variables: { traceId: string } }>();

v1.get("/", (c) => {
  return c.json({
    success: true,
    data: {
      message: "BaseForge SaaS API v1 activa.",
    },
    meta: null,
    traceId: c.get("traceId"),
  });
});

// Registrar rutas de módulos
v1.route("/auth", authRoutes);
v1.route("/users", usersRoutes);
v1.route("/roles", rolesRoutes);
v1.route("/me", meRoutes);
v1.route("/menus", menusRoutes);
v1.route("/superadmin", superadminRoutes);
v1.route("/settings", settingsRoutes);
v1.route("/notifications", notificationsRoutes);
v1.route("/files", filesRoutes);



app.route("/api/v1", v1);

// ─── Graceful Shutdown ────────────────────────────────────────────────────
import { closeDatabase } from "./database/db";

async function shutdown(signal: string) {
  logger.info({ msg: `Recibida señal ${signal}. Iniciando shutdown graceful...` });
  await closeDatabase();
  logger.info({ msg: "Conexiones cerradas. Servidor detenido." });
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

logger.info(`Servidor HTTP iniciado en http://localhost:${env.PORT}`);
if (env.NODE_ENV !== "production") {
  logger.info(`Documentación Swagger interactiva disponible en http://localhost:${env.PORT}/docs`);
}

export default {
  port: env.PORT,
  fetch: app.fetch,
};
