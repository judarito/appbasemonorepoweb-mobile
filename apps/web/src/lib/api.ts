import { useAuthStore } from "../store/authStore";

const BASE_URL = "http://localhost:3000/api/v1";

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: ErrorDetail[] = []
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Session killer ────────────────────────────────────────────────────────
// Si la API responde 401, el token expiró. Limpiamos sesión y redirigimos.
let isRedirecting = false;

function killSession(): void {
  if (isRedirecting) return; // evitar bucles
  isRedirecting = true;

  responseCache.clear();
  useAuthStore.getState().logout();

  // Redirigir al login. Usar window.location en vez de navigate()
  // porque esto puede ocurrir fuera del contexto de React Router.
  const currentPath = window.location.pathname;
  if (currentPath !== "/login" && currentPath !== "/") {
    window.location.href = "/login";
  }
}

// ─── Cache de respuestas GET (corto plazo) ──────────────────────────────────
// React StrictMode monta cada componente 2 veces en desarrollo. Usamos
// un caché de 500ms para que la segunda llamada al mismo endpoint reuse
// la promesa de la primera, evitando fetch duplicados.
const responseCache = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 500;

function cachedFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = responseCache.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    setTimeout(() => {
      if (responseCache.get(key) === promise) {
        responseCache.delete(key);
      }
    }, CACHE_TTL_MS);
  });
  responseCache.set(key, promise);
  return promise;
}

// ─── Retry logic ────────────────────────────────────────────────────────────
interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 500;

const DEFAULT_RETRY: Required<RetryOptions> = {
  maxAttempts: DEFAULT_MAX_RETRIES,
  baseDelayMs: DEFAULT_RETRY_DELAY_MS,
};

/**
 * Determina si un error HTTP es reintentable.
 * Solo reintenta errores de red y 5xx.
 * 4xx NUNCA se reintentan (son errores de lógica, no de conexión).
 */
function isRetryable(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof SyntaxError) return true;

  if (error instanceof ApiError) {
    if (error.status === 401) return false; // sesión expirada — nunca reintentar
    if (error.status === 429 || error.status === 408) return true;
    if (error.status >= 500) return true;
    return false;
  }

  const msg = (error as Error)?.message?.toLowerCase() || "";
  if (["fetch", "network", "timeout", "abort", "econnrefused", "enotfound", "failed to fetch", "load failed"]
      .some((kw) => msg.includes(kw))) return true;

  return false;
}

async function withRetryFrontend<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === opts.maxAttempts || !isRetryable(error)) throw error;

      const delay = opts.baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * delay * 0.1;
      console.warn(
        `[API] ${(error as Error).name}: ${(error as Error).message} — ` +
        `reintento ${attempt}/${opts.maxAttempts - 1} en ${Math.round(delay + jitter)}ms`
      );
      await new Promise((r) => setTimeout(r, delay + jitter));
    }
  }
  throw lastError;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
  let url = `${BASE_URL}/${path.replace(/^\//, "")}`;
  if (!params) return url;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = useAuthStore.getState().getEffectiveToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, body?: Record<string, unknown> | FormData, options?: RequestOptions): Promise<T> {
  const cacheKey = method === "GET" ? `GET:${buildUrl(path, options?.params)}` : "";
  const exec = () => withRetryFrontend(async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
      ...options?.headers,
    };

    const res = await fetch(buildUrl(path, options?.params), {
      method,
      headers,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Token expirado — matar sesión y redirigir al login
    if (res.status === 401) {
      killSession();
      throw new ApiError(401, "SESSION_EXPIRED", "Sesión expirada. Redirigiendo al login...");
    }

    const json = await res.json();

    if (!res.ok) {
      throw new ApiError(
        res.status,
        json.error?.code || "API_ERROR",
        json.error?.message || `Error ${res.status}`,
        json.error?.details || []
      );
    }

    return json.data as T;
  });

  return cacheKey ? cachedFetch(cacheKey, exec) : exec();
}

// ─── API wrapper ────────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),

  /** GET que retorna el body completo { success, data, meta, traceId } */
  getRaw: async <T>(path: string, options?: RequestOptions) => {
    const cacheKey = `GET:${buildUrl(path, options?.params)}`;
    const exec = () => withRetryFrontend(async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
        ...options?.headers,
      };
      const res = await fetch(buildUrl(path, options?.params), { method: "GET", headers });
      if (res.status === 401) { killSession(); throw new ApiError(401, "SESSION_EXPIRED", "Sesión expirada."); }
      return res.json() as Promise<T>;
    });
    return cachedFetch(cacheKey, exec);
  },

  post: <T>(path: string, body?: Record<string, unknown>, options?: RequestOptions) =>
    request<T>("POST", path, body, options),

  put: <T>(path: string, body?: Record<string, unknown>, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),

  patch: <T>(path: string, body?: Record<string, unknown>, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),

  /** Helper para subida/descarga de archivos (usa FormData, sin JSON) */
  files: {
    upload: async (file: File | Blob, originalFileName?: string, visibility: "PRIVATE" | "TENANT" | "PUBLIC" = "PRIVATE") => {
      return withRetryFrontend(async () => {
        const formData = new FormData();
        formData.append("file", file, originalFileName);
        formData.append("visibility", visibility);
        const headers = await getAuthHeaders();
        const res = await fetch(`${BASE_URL}/files/upload`, {
          method: "POST",
          headers,
          body: formData,
        });
        if (res.status === 401) { killSession(); throw new ApiError(401, "SESSION_EXPIRED", "Sesión expirada."); }
        const json = await res.json();
        if (!res.ok) throw new ApiError(res.status, json.error?.code || "UPLOAD_ERROR", json.error?.message || "Error al subir archivo");
        return json.data as Record<string, unknown>;
      });
    },
    list: async (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.append("page", String(params.page));
      if (params?.limit) qs.append("pageSize", String(params.limit));
      const query = qs.toString() ? `?${qs.toString()}` : "";
      // Retorna JSON completo porque el caller accede a .data.items y .data.totalItems
      return api.getRaw<{ data: { items: any[]; totalItems: number } }>(`files${query}`);
    },
    delete: async (id: string) => api.getRaw<Record<string, unknown>>(`files/${id}`),
  },
};
