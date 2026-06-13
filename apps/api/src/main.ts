import { Hono } from "hono";
import { cors } from "hono/cors";
import { traceMiddleware } from "./middlewares/trace";
import { loggerMiddleware, logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/error";

const app = new Hono();

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

// Endpoint de salud básico
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

// Endpoint de listo básico
app.get("/ready", (c) => {
  return c.json({
    success: true,
    data: {
      status: "READY",
      timestamp: new Date().toISOString(),
    },
    meta: null,
    traceId: c.get("traceId"),
  });
});

// Grupo de rutas API v1
const v1 = new Hono();

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

app.route("/api/v1", v1);

const port = Number(process.env.PORT) || 3000;

logger.info(`Servidor HTTP iniciado en http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
