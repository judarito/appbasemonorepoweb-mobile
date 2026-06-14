# AppListView — Componente de Listado Universal

> **BF-3114** — Versión 1.0 — 2026-06-14

---

## Descripción

`AppListView` es un componente React que estandariza todos los listados administrativos. Proporciona:

- Paginación server-side
- Búsqueda textual
- Filtros avanzados
- Ordenamiento por columnas
- Exportación a CSV
- Skeletons en carga inicial
- Datos persistentes en recarga (sin parpadeo)
- Manejo de errores y estado vacío

---

## Uso básico

```tsx
function UsersView() {
  const fetcher = async (query) => {
    const res = await api.get("/users", { params: query });
    return { items: res.items, totalItems: res.totalItems };
  };

  const columns: ColumnDefinition[] = [
    { key: "email", header: "Email", sortable: true },
    { key: "status", header: "Estado", render: (u) => <StatusBadge status={u.status} /> },
  ];

  return (
    <AppListView
      title="Usuarios"
      fetcher={fetcher}
      columns={columns}
      defaultPageSize={20}
      allowedPageSizes={[10, 20, 50, 100]}
      searchPlaceholder="Buscar por email..."
    />
  );
}
```

---

## Props

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `title` | `string` | — | Título del listado |
| `fetcher` | `(query) => Promise` | — | Función que obtiene los datos |
| `columns` | `ColumnDefinition[]` | — | Definición de columnas |
| `filters` | `FilterDefinition[]` | `[]` | Filtros avanzados |
| `rowActions` | `RowAction[]` | `[]` | Acciones por fila |
| `defaultPageSize` | `number` | `20` | Filas por página inicial |
| `allowedPageSizes` | `number[]` | `[10,20,50,100]` | Opciones de paginación |
| `searchPlaceholder` | `string` | `"Buscar..."` | Placeholder del buscador |
| `enableExport` | `boolean` | `false` | Mostrar botón de exportación |
| `exportFileName` | `string` | `"export"` | Nombre del archivo CSV |

---

## ColumnDefinition

```typescript
interface ColumnDefinition<T> {
  key: string;              // Campo del objeto
  header: string;           // Texto del encabezado
  sortable?: boolean;       // Permitir ordenamiento
  width?: string;           // Ancho CSS (ej: "120px")
  render?: (item: T) => React.ReactNode; // Render personalizado
}
```

---

## Fetcher

La función `fetcher` recibe:

```typescript
{
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  // Filtros dinámicos según FilterDefinition
  [filterKey: string]: any;
}
```

Y debe retornar:

```typescript
{
  items: T[];
  totalItems: number;
}
```
