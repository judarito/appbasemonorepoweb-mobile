import { describe, test, expect } from "bun:test";
import { Hono } from "hono";
import { errorHandler } from "../../middlewares/error";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from "../../common/errors";

describe("Global Error Handler Suite", () => {
  const app = new Hono();
  app.onError(errorHandler());

  app.get("/error-validation", () => {
    throw new ValidationError("Datos inválidos", [{ field: "email", error: "Required" }]);
  });

  app.get("/error-unauthorized", () => {
    throw new UnauthorizedError("Sesión expirada");
  });

  app.get("/error-forbidden", () => {
    throw new ForbiddenError("Privilegios insuficientes");
  });

  app.get("/error-notfound", () => {
    throw new NotFoundError("Usuario inexistente");
  });

  app.get("/error-conflict", () => {
    throw new ConflictError("El email ya está en uso");
  });

  app.get("/error-generic", () => {
    throw new Error("Algo inesperado ocurrió en el servidor");
  });

  test("Debería mapear ValidationError a 400 con código VALIDATION_ERROR y detalles", async () => {
    const res = await app.request("/error-validation");
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toBe("Datos inválidos");
    expect(json.error.details).toEqual([{ field: "email", error: "Required" }]);
  });

  test("Debería mapear UnauthorizedError a 401 con código UNAUTHORIZED", async () => {
    const res = await app.request("/error-unauthorized");
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toBe("Sesión expirada");
  });

  test("Debería mapear ForbiddenError a 403 con código FORBIDDEN", async () => {
    const res = await app.request("/error-forbidden");
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toBe("Privilegios insuficientes");
  });

  test("Debería mapear NotFoundError a 404 con código NOT_FOUND", async () => {
    const res = await app.request("/error-notfound");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
    expect(json.error.message).toBe("Usuario inexistente");
  });

  test("Debería mapear ConflictError a 409 con código CONFLICT", async () => {
    const res = await app.request("/error-conflict");
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("CONFLICT");
    expect(json.error.message).toBe("El email ya está en uso");
  });

  test("Debería mapear Error genérico a 500 con código INTERNAL_SERVER_ERROR", async () => {
    const res = await app.request("/error-generic");
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
