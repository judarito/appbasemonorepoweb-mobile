import type { Context } from "hono";

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
 * Parsea y valida los parámetros de paginación desde la query string.
 */
export function parsePaginationParams(c: Context): PaginationParams {
  const pageStr = c.req.query("page");
  const pageSizeStr = c.req.query("pageSize");

  let page = pageStr ? parseInt(pageStr, 10) : 1;
  let pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : 20;

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(pageSize) || pageSize < 1) {
    pageSize = 20;
  } else if (pageSize > 100) {
    pageSize = 100; // Máximo 100 elementos por página según plan maestro
  }

  return { page, pageSize };
}

/**
 * Construye el objeto meta con información de paginación para la respuesta estándar.
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
