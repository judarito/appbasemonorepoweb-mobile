/**
 * Retry Utility — BaseForge SaaS
 *
 * Proporciona funciones para reintentar operaciones con backoff exponencial.
 * Usado para resiliencia en conexiones a base de datos, API externas, etc.
 */

export interface RetryOptions {
  /** Número máximo de intentos (por defecto: 3) */
  maxAttempts?: number;
  /** Tiempo base de espera en ms (por defecto: 1000) */
  baseDelayMs?: number;
  /** Factor de backoff exponencial (por defecto: 2) */
  backoffFactor?: number;
  /** Tiempo máximo de espera en ms (por defecto: 10000) */
  maxDelayMs?: number;
  /** Función para determinar si el error es reintentable */
  retryable?: (error: unknown) => boolean;
  /** Logger opcional para registrar intentos */
  logger?: (msg: string, ...args: unknown[]) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "logger">> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 10000,
  retryable: () => true,
};

/**
 * Ejecuta una función asíncrona con reintentos automáticos usando
 * backoff exponencial con jitter.
 *
 * @param fn Función asíncrona a ejecutar
 * @param options Opciones de reintento
 * @returns El resultado de la función
 * @throws El último error si se agotan los reintentos
 *
 * @example
 * ```ts
 * const data = await withRetry(
 *   () => db.query.users.findMany(),
 *   { maxAttempts: 5, logger: console.log }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === opts.maxAttempts;

      if (isLastAttempt || !opts.retryable(error)) {
        throw error;
      }

      // Calcular delay con backoff exponencial + jitter
      const delay = Math.min(
        opts.baseDelayMs * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelayMs
      );
      const jitter = Math.random() * delay * 0.1; // 10% de jitter
      const totalDelay = Math.round(delay + jitter);

      opts.logger?.(
        `[Retry] Intento ${attempt}/${opts.maxAttempts} falló. Reintentando en ${totalDelay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}

/**
 * Verifica si un error de base de datos es reintentable.
 * Los errores de conexión y timeout son reintentables;
 * los errores de sintaxis SQL o violación de constraints no.
 */
export function isDbErrorRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const msg = error.message.toLowerCase();

  // Errores reintentables
  if (
    msg.includes("connection refused") ||
    msg.includes("connection timeout") ||
    msg.includes("connection closed") ||
    msg.includes("socket hang up") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("enotfound") ||
    msg.includes("deadlock detected") ||
    msg.includes("too many connections") ||
    msg.includes("query read timeout") ||
    msg.includes("no available connection")
  ) {
    return true;
  }

  // Errores NO reintentables
  if (
    msg.includes("syntax error") ||
    msg.includes("duplicate key") ||
    msg.includes("foreign key") ||
    msg.includes("not null") ||
    msg.includes("check constraint")
  ) {
    return false;
  }

  // Por defecto, reintentar errores genéricos de conexión
  return true;
}

/**
 * Verifica si un error HTTP es reintentable para llamadas a API externas.
 */
export function isHttpErrorRetryable(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    // 5xx son reintentables, 4xx no (excepto 429 Too Many Requests y 408 Timeout)
    if (status >= 500) return true;
    if (status === 429 || status === 408) return true;
    return false;
  }

  // Errores de red son reintentables
  return true;
}
