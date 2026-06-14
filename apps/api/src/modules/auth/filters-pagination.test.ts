import { describe, test, expect } from "bun:test";
import { Hono } from "hono";
import { parsePaginationParams, buildPaginationMeta } from "../../common/utils/query";

describe("Pagination and Filters Utility Suite", () => {
  test("Debería parsear parámetros correctos e ignorar valores inválidos", async () => {
    const app = new Hono();
    let parsed: any;
    app.get("/test", (c) => {
      parsed = parsePaginationParams(c);
      return c.text("ok");
    });

    // 1. Valores correctos
    await app.request("/test?page=3&pageSize=45");
    expect(parsed.page).toBe(3);
    expect(parsed.pageSize).toBe(45);

    // 2. Valores faltantes (default = 10)
    await app.request("/test");
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);

    // 3. Negativos o inválidos
    await app.request("/test?page=-5&pageSize=not-a-number");
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);
  });

  test("Debería limitar (cap) el pageSize al máximo establecido (100)", async () => {
    const app = new Hono();
    let parsed: any;
    app.get("/test", (c) => {
      parsed = parsePaginationParams(c);
      return c.text("ok");
    });

    await app.request("/test?page=1&pageSize=150");
    expect(parsed.pageSize).toBe(100);
  });

  test("Debería construir los metadatos de paginación correctamente", () => {
    // Caso 1: Primera página, múltiples páginas
    const meta1 = buildPaginationMeta(1, 10, 35);
    expect(meta1.pagination.page).toBe(1);
    expect(meta1.pagination.pageSize).toBe(10);
    expect(meta1.pagination.totalItems).toBe(35);
    expect(meta1.pagination.totalPages).toBe(4);
    expect(meta1.pagination.hasPreviousPage).toBe(false);
    expect(meta1.pagination.hasNextPage).toBe(true);

    // Caso 2: Última página
    const meta2 = buildPaginationMeta(4, 10, 35);
    expect(meta2.pagination.page).toBe(4);
    expect(meta2.pagination.hasPreviousPage).toBe(true);
    expect(meta2.pagination.hasNextPage).toBe(false);

    // Caso 3: Cero items
    const meta3 = buildPaginationMeta(1, 20, 0);
    expect(meta3.pagination.totalPages).toBe(1);
    expect(meta3.pagination.hasPreviousPage).toBe(false);
    expect(meta3.pagination.hasNextPage).toBe(false);
  });
});
