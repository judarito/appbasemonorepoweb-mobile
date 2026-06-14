/**
 * Rate Limiting Middleware — BaseForge SaaS
 *
 * Protege los endpoints de autenticación contra ataques de fuerza bruta.
 * Almacena contadores en memoria (Map). Para multi-instancia, reemplazar
 * con Redis en producción.
 *
 * Uso:
 *   import { rateLimit } from "../middlewares/rate-limit";
 *   router.post("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), controller.login);
 */

import type { Context, Next } from "hono";
import { TooManyRequestsError } from "../common/errors";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Ventana de tiempo en milisegundos (por defecto: 15 min) */
  windowMs?: number;
  /** Máximo de requests en la ventana (por defecto: 5) */
  max?: number;
  /** Clave personalizada (por defecto: IP) */
  keyFn?: (c: Context) => string;
  /** Nombre para logs */
  name?: string;
}

const store = new Map<string, RateLimitEntry>();

// Limpieza periódica de entradas expiradas (cada 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Middleware de rate limiting configurable.
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const max = options.max ?? 5;
  const keyFn = options.keyFn ?? ((c: Context) => {
    return c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  });
  const name = options.name ?? "rate-limit";

  return async (c: Context, next: Next) => {
    const key = `${name}:${keyFn(c)}`;
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Headers informativos
    c.res.headers.set("X-RateLimit-Limit", String(max));
    c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    c.res.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      throw new TooManyRequestsError(
        `Demasiadas solicitudes. Intenta de nuevo en ${Math.ceil((entry.resetAt - now) / 1000)} segundos.`
      );
    }

    await next();
  };
}
