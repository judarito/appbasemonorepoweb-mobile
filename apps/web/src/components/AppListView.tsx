import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download, RotateCw, X, SlidersHorizontal, AlertTriangle, CheckSquare, Square, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { AppListViewProps, ListQuery, SortDirection, FilterValues, RowAction, BulkAction, ColumnDefinition } from "./AppListView.types";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_ALLOWED_SIZES = [10, 20, 50, 100];

// --- Hook de debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// --- Componente principal ---
export function AppListView<T extends { id: string }>({
  title,
  subtitle,
  fetcher,
  columns,
  filters = [],
  rowActions = [],
  bulkActions = [],
  defaultPageSize = DEFAULT_PAGE_SIZE,
  allowedPageSizes = DEFAULT_ALLOWED_SIZES,
  searchPlaceholder = "Buscar...",
  emptyState,
  enableExport = false,
  exportFileName = "export",
  exportTransformer,
}: AppListViewProps<T>) {
  // Estado de paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estado de datos
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de búsqueda y ordenamiento
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Estado de filtros
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [showFilters, setShowFilters] = useState(false);

  // Estado de selección
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Debounce para búsqueda
  const debouncedSearch = useDebounce(search, 400);

  // Refs para exportación y seguimiento de recarga
  const exportLoading = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Construir query ---
  const buildQuery = useCallback((): ListQuery => {
    const query: ListQuery = {
      page,
      pageSize,
      search: debouncedSearch || undefined,
      sortBy,
      sortDirection,
    };

    Object.entries(filterValues).forEach(([key, value]) => {
      if (value !== "" && value !== undefined) {
        query[key] = value;
      }
    });

    return query;
  }, [page, pageSize, debouncedSearch, sortBy, sortDirection, filterValues]);

  // --- Fetch datos ---
  const fetchData = useCallback(async () => {
    setError(null);

    if (isFirstLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const query = buildQuery();
      const result = await fetcher(query);
      setItems(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(Math.ceil(result.totalItems / pageSize));
      setIsFirstLoad(false);
    } catch (err: any) {
      setError(err?.message || "Error al cargar los datos.");
      if (isFirstLoad) {
        setItems([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [buildQuery, fetcher, pageSize, isFirstLoad]);

  // Efecto principal con dedup: marcar el efecto como ejecutado a nivel de módulo
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Resetear página al cambiar búsqueda o filtros
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterValues]);

  // --- Handlers ---
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilterValues({});
    setSearch("");
    setSortBy(undefined);
    setSortDirection("asc");
    setPage(1);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRetry = () => {
    fetchData();
  };

  // --- Exportar CSV ---
  const handleExport = async () => {
    if (exportLoading.current) return;
    exportLoading.current = true;

    try {
      // Obtener todos los datos para exportar (sin paginación)
      const allData = await fetcher({ page: 1, pageSize: 10000 });
      const exportData = exportTransformer
        ? allData.items.map(exportTransformer)
        : allData.items.map((item) => {
            const row: Record<string, unknown> = {};
            columns.forEach((col) => {
              row[col.header] = (item as any)[col.key] ?? "";
            });
            return row;
          });

      // Generar CSV
      const headers = Object.keys(exportData[0] || {});
      const csvLines = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((h) => {
            const val = String(row[h] ?? "");
            // Escapar comillas y comas
            if (val.includes(",") || val.includes('"') || val.includes("\n")) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          }).join(",")
        ),
      ];

      const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportFileName}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar:", err);
    } finally {
      exportLoading.current = false;
    }
  };

  // --- Sort indicator ---
  const SortIndicator = ({ column }: { column: ColumnDefinition<T> }) => {
    if (!column.sortable) return null;
    const isActive = sortBy === column.key;
    return (
      <span className="app-list-sort-indicator">
        {isActive && sortDirection === "asc" && <ChevronUp size={14} />}
        {isActive && sortDirection === "desc" && <ChevronDown size={14} />}
        {!isActive && <ChevronUp size={14} className="sort-inactive" />}
      </span>
    );
  };

  // --- Render columna ---
  const renderCell = (item: T, column: ColumnDefinition<T>) => {
    if (column.render) return column.render(item);
    return String((item as any)[column.key] ?? "");
  };

  // --- Filtros activos count ---
  const activeFilterCount = useMemo(
    () => Object.values(filterValues).filter((v) => v !== "" && v !== undefined).length,
    [filterValues]
  );

  // --- Skeleton ---
  const Skeleton = () => (
    <div className="app-list-skeleton">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="app-list-skeleton-row" style={{ animationDelay: `${i * 0.05}s` }}>
          {bulkActions.length > 0 && <div className="skeleton-cell skeleton-checkbox" />}
          {columns.map((col) => (
            <div
              key={col.key}
              className="skeleton-cell"
              style={{ width: col.width || "100px" }}
            />
          ))}
          {rowActions.length > 0 && <div className="skeleton-cell skeleton-actions" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="app-list-view">
      {/* Header */}
      <div className="app-list-header">
        <div className="app-list-title-section">
          <h2 className="app-list-title">{title}</h2>
          {subtitle && <p className="app-list-subtitle">{subtitle}</p>}
          {!loading && !error && (
            <span className="app-list-count">{totalItems.toLocaleString()} registros</span>
          )}
        </div>
        <div className="app-list-header-actions">
          {enableExport && items.length > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExport}
              title="Exportar a CSV"
            >
              <Download size={14} /> Exportar
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: Búsqueda + Filtros + Acciones masivas */}
      <div className="app-list-toolbar">
        <div className="app-list-toolbar-left">
          {/* Búsqueda */}
          <div className="app-list-search">
            <Search size={16} className="app-list-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="app-list-search-input"
            />
            {search && (
              <button className="app-list-search-clear" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Botón filtros */}
          {filters.length > 0 && (
            <button
              className={`btn btn-secondary btn-sm ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={14} /> Filtros
              {activeFilterCount > 0 && (
                <span className="app-list-filter-badge">{activeFilterCount}</span>
              )}
            </button>
          )}
        </div>

        <div className="app-list-toolbar-right">
          {/* Acciones masivas */}
          {selectedIds.size > 0 && (
            <div className="app-list-bulk-actions">
              <span className="app-list-selected-count">
                {selectedIds.size} seleccionados
              </span>
              {bulkActions.map((action, idx) => (
                <button
                  key={idx}
                  className={`btn btn-sm ${action.variant === "danger" ? "btn-danger" : "btn-secondary"}`}
                  onClick={() => action.onClick(items.filter((i) => selectedIds.has(i.id)))}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && filters.length > 0 && (
        <div className="app-list-filters-panel">
          <div className="app-list-filters-grid">
            {filters.map((filter) => (
              <div key={filter.key} className="app-list-filter-item">
                <label className="app-list-filter-label">{filter.label}</label>
                {filter.type === "select" ? (
                  <select
                    value={filterValues[filter.key] || ""}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="app-list-filter-select"
                  >
                    <option value="">Todos</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === "date" ? (
                  <input
                    type="date"
                    value={filterValues[filter.key] || ""}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="app-list-filter-input"
                  />
                ) : (
                  <input
                    type="text"
                    value={filterValues[filter.key] || ""}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder || `Filtrar por ${filter.label}`}
                    className="app-list-filter-input"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="app-list-filters-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
              <RotateCw size={14} /> Restablecer
            </button>
          </div>
        </div>
      )}

      {/* Tabla / Lista */}
      <div className={`app-list-table-container${isRefreshing ? " is-refreshing" : ""}`}>
        {/* Barra de progreso sutil en recargas */}
        {isRefreshing && <div className="app-list-refresh-bar" />}

        {/* Skeleton solo en primera carga */}
        {loading && isFirstLoad && <Skeleton />}

        {/* Error state (sin datos previos) */}
        {error && items.length === 0 && (
          <div className="app-list-error">
            <AlertTriangle size={24} />
            <p>{error}</p>
            <button className="btn btn-primary btn-sm" onClick={handleRetry}>
              <RotateCw size={14} /> Reintentar
            </button>
          </div>
        )}

        {/* Error banner (cuando ya hay datos previos) */}
        {error && items.length > 0 && (
          <div className="app-list-error-banner">
            <AlertTriangle size={14} />
            <span>{error}</span>
            <button className="btn btn-secondary btn-xs" onClick={handleRetry}>
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && !isFirstLoad && (
          <div className="app-list-empty">
            {emptyState || (
              <>
                <Search size={32} />
                <p>No se encontraron registros.</p>
                {(search || activeFilterCount > 0) && (
                  <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
                    <RotateCw size={14} /> Limpiar filtros
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Tabla: siempre renderizada cuando hay datos (incluso durante recarga) */}
        {items.length > 0 && (
          <div className={`app-list-table-wrapper${isRefreshing ? " is-refreshing" : ""}`}>
            <table className="app-list-table">
              <thead>
                <tr>
                  {bulkActions.length > 0 && (
                    <th className="app-list-cell-checkbox" onClick={handleSelectAll} style={{ cursor: "pointer" }}>
                      {selectedIds.size === items.length ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`app-list-th ${col.sortable ? "app-list-th-sortable" : ""}`}
                      style={{
                        width: col.width,
                        textAlign: col.align || "left",
                      }}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <div className="app-list-th-content">
                        {col.header}
                        <SortIndicator column={col} />
                      </div>
                    </th>
                  ))}
                  {rowActions.length > 0 && (
                    <th className="app-list-th-actions">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="app-list-tbody">
                {items.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`app-list-tr ${isSelected ? "app-list-tr-selected" : ""}`}
                    >
                      {bulkActions.length > 0 && (
                        <td
                          className="app-list-cell-checkbox"
                          onClick={() => handleSelectItem(item.id)}
                          style={{ cursor: "pointer" }}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} />
                          )}
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          data-label={col.header}
                          className={`app-list-td ${col.cellClass || ""}`}
                          style={{ textAlign: col.align || "left" }}
                        >
                          {renderCell(item, col)}
                        </td>
                      ))}
                      {rowActions.length > 0 && (
                        <td className="app-list-cell-actions">
                          <div className="app-list-row-actions">
                            {rowActions
                              .filter((action) => {
                                if (typeof action.hidden === "function") return !action.hidden(item);
                                return !action.hidden;
                              })
                              .map((action, idx) => {
                                const isDisabled = typeof action.disabled === "function"
                                  ? action.disabled(item)
                                  : action.disabled;
                                return (
                                  <button
                                    key={idx}
                                    className={`app-list-action-btn ${action.variant === "danger" ? "danger" : ""}`}
                                    onClick={() => !isDisabled && action.onClick(item)}
                                    disabled={isDisabled}
                                    title={action.label}
                                  >
                                    {action.icon}
                                    <span className="app-list-action-label">{action.label}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {!loading && !error && totalPages > 1 && (
        <div className="app-list-pagination">
          <div className="app-list-pagination-left">
            <span className="app-list-pagination-info">
              Página {page} de {totalPages} · {totalItems.toLocaleString()} registros
            </span>
          </div>
          <div className="app-list-pagination-center">
            <div className="app-list-pagination-buttons">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                title="Primera página"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <span className="app-list-page-indicator">
                {page} / {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente <ChevronRight size={14} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                title="Última página"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
          <div className="app-list-pagination-right">
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="app-list-page-size-select"
              title="Registros por página"
            >
              {allowedPageSizes.map((size) => (
                <option key={size} value={size}>
                  {size} / pág
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
