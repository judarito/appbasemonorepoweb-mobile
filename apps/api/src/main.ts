import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { env } from "./config/env";
import { traceMiddleware } from "./middlewares/trace";
import { loggerMiddleware, logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/error";
import { db } from "./database/db";
import { sql } from "drizzle-orm";
import { openapiSpec } from "./common/openapi";
import { usersRoutes } from "./modules/users/users.routes";

const app = new Hono<{ Variables: { traceId: string } }>();

// Middlewares globales
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization", "x-trace-id"],
  exposeHeaders: ["x-trace-id"],
}));
app.use("*", traceMiddleware());
app.use("*", loggerMiddleware());

// Manejo global de errores
app.onError(errorHandler());

// Documentación Swagger (solo desarrollo/staging)
if (env.NODE_ENV !== "production") {
  app.get("/swagger.json", (c) => c.json(openapiSpec));
  app.get("/docs", swaggerUI({ url: "/swagger.json" }));
}

// Endpoint de salud básico (rápido, no toca base de datos)
app.get("/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "UP",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    meta: null,
    traceId: c.get("traceId"),
  });
});

// Endpoint de listo (completo, verifica conexión a base de datos)
app.get("/ready", async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({
      success: true,
      data: {
        status: "READY",
        database: "CONNECTED",
        timestamp: new Date().toISOString(),
      },
      meta: null,
      traceId: c.get("traceId"),
    });
  } catch (error: any) {
    logger.error({
      traceId: c.get("traceId"),
      err: error,
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
v1.route("/users", usersRoutes);

app.route("/api/v1", v1);

logger.info(`Servidor HTTP iniciado en http://localhost:${env.PORT}`);
if (env.NODE_ENV !== "production") {
  logger.info(`Documentación Swagger interactiva disponible en http://localhost:${env.PORT}/docs`);
}

export default {
  port: env.PORT,
  fetch: app.fetch,
};
