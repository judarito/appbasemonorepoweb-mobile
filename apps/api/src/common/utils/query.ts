import type { Context } from "hono";
import { settingsCache } from "../cache.service";

// =============================================================================
// OFFSET PAGINATION (backward compatible)
// =============================================================================

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Lee el page_size configurado por tenant desde la caché de settings.
 * Si no está disponible, retorna el valor global por defecto.
 */
function getTenantDefaultPageSize(tenantId?: string | null): number {
  if (!tenantId) return DEFAULT_PAGE_SIZE;

  const tenantSettings = settingsCache.get(`tenant:${tenantId}:settings`) as Record<string, unknown> | undefined;
  const raw = tenantSettings?.["pagination.page_size"];

  if (raw !== undefined && raw !== null) {
    const parsed = Number(raw);
    if (!isNaN(parsed) && parsed > 0 && parsed <= MAX_PAGE_SIZE) {
      return parsed;
    }
  }

  return DEFAULT_PAGE_SIZE;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

/**
 * Parsea y valida los parámetros de paginación por offset desde la query string.
 *
 * El pageSize por defecto se resuelve automáticamente desde la configuración
 * del tenant (`pagination.page_size` en tenant_settings) si el tenant está
 * disponible en el contexto. Si no hay configuración, usa 10.
 *
 * @param c Contexto de Hono
 */
export function parsePaginationParams(c: Context): PaginationParams {
  const pageStr = c.req.query("page");
  const pageSizeStr = c.req.query("pageSize");

  let page = pageStr ? parseInt(pageStr, 10) : 1;

  // Resolver default del tenant desde la caché de settings
  const tenantId = c.get("tenantId" as any) as string | undefined;
  const defaultSize = getTenantDefaultPageSize(tenantId);

  let pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : defaultSize;

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(pageSize) || pageSize < 1) {
    pageSize = defaultSize;
  } else if (pageSize > MAX_PAGE_SIZE) {
    pageSize = MAX_PAGE_SIZE;
  }

  return { page, pageSize };
}

/**
 * Construye el objeto meta con información de paginación offset para la respuesta estándar.
 */
export function buildPaginationMeta(page: number, pageSize: number, totalItems: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
}

// =============================================================================
// CURSOR PAGINATION
// =============================================================================

/**
 * Parámetros de paginación por cursor.
 *
 * El cursor es opaco para el cliente — es un string base64 que codifica
 * { id, createdAt } del último elemento de la página anterior.
 *
 * Uso:
 *   GET /api/v1/users?pageSize=20               → primera página
 *   GET /api/v1/users?pageSize=20&after=<cursor> → página siguiente
 *   GET /api/v1/users?pageSize=20&before=<cursor>→ página anterior
 */
export interface CursorPaginationParams {
  pageSize: number;
  after?: CursorPayload;   // Cursor para página siguiente
  before?: CursorPayload;  // Cursor para página anterior
}

export interface CursorPayload {
  id: string;
  createdAt: string; // ISO 8601
}

/**
 * Metadatos de respuesta para paginación por cursor.
 */
export interface CursorPaginationMeta {
  cursor: {
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string | null;  // base64 del último item
    prevCursor: string | null;  // base64 del primer item
  };
}

/**
 * Parsea los parámetros de cursor desde la query string.
 */
export function parseCursorParams(c: Context): CursorPaginationParams {
  const pageSizeStr = c.req.query("pageSize");
  const afterStr = c.req.query("after");
  const beforeStr = c.req.query("before");

  let pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : 20;
  if (isNaN(pageSize) || pageSize < 1) pageSize = 20;
  if (pageSize > 100) pageSize = 100;

  return {
    pageSize,
    after: afterStr ? decodeCursor(afterStr) : undefined,
    before: beforeStr ? decodeCursor(beforeStr) : undefined,
  };
}

/**
 * Construye el objeto meta de cursor para la respuesta.
 * @param items  - los items de la página actual (ya recortados a pageSize)
 * @param pageSize - tamaño de página solicitado
 * @param fetchedCount - cuántos items se obtuvieron antes de recortar (pageSize + 1)
 */
export function buildCursorMeta<T extends { id: string; createdAt: Date | string }>(
  items: T[],
  pageSize: number,
  fetchedCount: number,
  hasBefore: boolean
): CursorPaginationMeta {
  const hasNextPage = fetchedCount > pageSize;
  const hasPreviousPage = hasBefore;

  const nextCursor = hasNextPage && items.length > 0
    ? encodeCursor(items[items.length - 1])
    : null;

  const prevCursor = hasPreviousPage && items.length > 0
    ? encodeCursor(items[0])
    : null;

  return {
    cursor: {
      pageSize,
      hasNextPage,
      hasPreviousPage,
      nextCursor,
      prevCursor,
    },
  };
}

/**
 * Codifica un cursor como base64 URL-safe.
 */
export function encodeCursor(item: { id: string; createdAt: Date | string }): string {
  const payload: CursorPayload = {
    id: item.id,
    createdAt: item.createdAt instanceof Date
      ? item.createdAt.toISOString()
      : item.createdAt,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/**
 * Decodifica un cursor base64. Retorna undefined si es inválido.
 */
export function decodeCursor(cursor: string): CursorPayload | undefined {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (typeof parsed.id === "string" && typeof parsed.createdAt === "string") {
      return parsed as CursorPayload;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
