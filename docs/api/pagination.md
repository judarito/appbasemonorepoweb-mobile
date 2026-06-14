# Paginación — BaseForge SaaS

> **BF-3113** — Versión 1.0 — 2026-06-14

---

## Contrato

```http
GET /api/v1/users?page=1&pageSize=20&search=juan&sortBy=createdAt&sortDirection=desc
```

### Respuesta

```json
{
  "success": true,
  "data": {
    "items": []
  },
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 120,
      "totalPages": 6,
      "hasPreviousPage": false,
      "hasNextPage": true
    }
  },
  "traceId": "uuid"
}
```

---

## Reglas

| Regla | Valor |
|---|---|
| `page` mínimo | 1 |
| `pageSize` por defecto | 20 |
| `pageSize` máximo | 100 |
| `search` | Búsqueda textual (LIKE / ILIKE en campos relevantes) |
| `sortBy` | Nombre del campo |
| `sortDirection` | `asc` o `desc` |

---

## Implementación backend

```typescript
async function paginatedQuery<T>(table, query) {
  const page = Math.max(1, query.page || 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const items = await db.select()
    .from(table)
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(table.createdAt));

  const [{ count }] = await db.select({ count: count() })
    .from(table);

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      hasPreviousPage: page > 1,
      hasNextPage: page * pageSize < count,
    },
  };
}
```

---

## Buenas prácticas

1. **Nunca** devolver listados sin paginación
2. **Siempre** aplicar filtros en el servidor
3. **Siempre** aplicar ordenamiento en el servidor
4. **Nunca** calcular `totalPages` en el frontend
5. **Usar** `LIMIT` + `OFFSET` para páginas < 10K resultados
6. **Evaluar** paginación por cursor para listados muy grandes (> 100K)

---

## Diferencia con paginación por cursor

| Aspecto | Offset (actual) | Cursor |
|---|---|---|
| Estabilidad | Inestable si hay inserciones | Estable |
| Performance | Degrada con OFFSET grande | Constante |
| Implementación | Simple | Más compleja |
| Navegación | Páginas numéricas | "Cargar más" |
