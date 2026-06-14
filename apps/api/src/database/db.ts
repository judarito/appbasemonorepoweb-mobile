import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env";
import { withRetry, isDbErrorRetryable } from "../common/retry";

const isSslRequired = env.DATABASE_URL.includes("sslmode=require") || process.env.DB_SSL === "true";

/**
 * Pool de conexiones a PostgreSQL.
 *
 * postgres-js maneja reconexiones automáticas en caliente: si la BD se cae,
 * las queries se reintentan transparentemente sin lógica adicional.
 *
 * La export `db` se crea inmediatamente (síncrona) y las queries reales
 * se ejecutan bajo demanda, momento en el que postgres-js establece la
 * conexión TCP si aún no lo ha hecho.
 */
const client = postgres(env.DATABASE_URL, {
  ssl: isSslRequired ? "require" : undefined,
  max: 10,
  idle_timeout: 30,
  connect_timeout: 15,
  max_lifetime: 60 * 30,
  connection: { application_name: "baseforge-api" },
  onnotice: () => {},
  transform: { undefined: null },
});

export const db = drizzle(client);
export type DbClient = typeof db;
export { client as postgresClient };

/**
 * Verifica la conectividad con la BD con reintentos automáticos.
 * Útil en startup para no arrancar el servidor hasta tener BD.
 */
export async function initializeDatabase(): Promise<void> {
  await withRetry(
    async () => { await client`SELECT 1 AS ping`; },
    {
      maxAttempts: 5,
      baseDelayMs: 1000,
      backoffFactor: 2,
      maxDelayMs: 15000,
      retryable: isDbErrorRetryable,
    }
  );
}

/**
 * Cierra todas las conexiones del pool.
 * Llamar en shutdown graceful (SIGTERM).
 */
export async function closeDatabase(): Promise<void> {
  try {
    await client.end();
  } catch {
    // ignorar errores en shutdown
  }
}
