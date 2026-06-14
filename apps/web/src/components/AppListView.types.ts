import type { ReactNode } from "react";

// --- Contrato de paginación (estándar del plan maestro) ---

export interface ListQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  [key: string]: unknown;
}

export type SortDirection = "asc" | "desc";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalItems: number;
}

// --- Definiciones de columnas y filtros ---

export interface ColumnDefinition<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  cellClass?: string;
}

export interface FilterDefinition {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "date-range" | "boolean";
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface RowAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  disabled?: boolean | ((item: T) => boolean);
  hidden?: boolean | ((item: T) => boolean);
  variant?: "default" | "danger";
  permission?: string;
}

export interface BulkAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (selectedItems: T[]) => void;
  variant?: "default" | "danger";
  permission?: string;
}

export interface FilterValues {
  [key: string]: string;
}

// --- Props del componente ---

export interface AppListViewProps<T> {
  /** Título del listado */
  title: string;
  /** Subtítulo opcional (ej: "X registros encontrados") */
  subtitle?: string;
  /** Array de keys para TanStack Query (si se usa externamente) */
  queryKey?: readonly unknown[];
  /** Función que obtiene los datos paginados */
  fetcher: (query: ListQuery) => Promise<PagedResult<T>>;
  /** Definición de columnas */
  columns: ColumnDefinition<T>[];
  /** Filtros opcionales */
  filters?: FilterDefinition[];
  /** Acciones por fila */
  rowActions?: RowAction<T>[];
  /** Acciones masivas */
  bulkActions?: BulkAction<T>[];
  /** Tamaño de página por defecto */
  defaultPageSize?: number;
  /** Tamaños de página permitidos */
  allowedPageSizes?: number[];
  /** Placeholder para el campo de búsqueda */
  searchPlaceholder?: string;
  /** Componente para estado vacío personalizado */
  emptyState?: ReactNode;
  /** Prefijo de permiso para ocultar acciones (implementación futura) */
  permissionPrefix?: string;
  /** Habilita exportación CSV */
  enableExport?: boolean;
  /** Nombre del archivo de exportación */
  exportFileName?: string;
  /** Función para transformar items antes de exportar */
  exportTransformer?: (item: T) => Record<string, unknown>;
}
