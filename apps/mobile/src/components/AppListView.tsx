import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { api } from "../config/api";
import { useTheme } from "../config/theme";
import BottomSheetFilters from "./BottomSheetFilters";

interface AppListViewProps<T> {
  endpoint: string;
  renderItem: ({ item }: { item: T }) => React.ReactElement;
  searchPlaceholder?: string;
  limit?: number;
  // Soporte de filtros opcional
  filterContent?: React.ReactNode;
  onApplyFilters?: () => Record<string, string>;
  // Soporte de ordenamiento
  sortFields?: { label: string; value: string }[];
}

export default function AppListView<T extends { id: string }>({
  endpoint,
  renderItem,
  searchPlaceholder = "Buscar...",
  limit = 10,
  filterContent,
  onApplyFilters,
  sortFields,
}: AppListViewProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Controladores de filtros y ordenación
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState(sortFields?.[0]?.value || "");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { colors, isDark } = useTheme();
  
  const searchTimeoutRef = useRef<any>(null);

  // Implementar debounce para la búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Carga de datos de la API
  const fetchData = useCallback(
    async (targetPage: number, query: string, isRefresh = false) => {
      if (!isRefresh && targetPage > 1 && !hasMore) return;

      if (targetPage === 1 && !isRefresh) {
        setLoading(true);
      } else if (targetPage > 1) {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const queryParams = new URLSearchParams({
          page: targetPage.toString(),
          limit: limit.toString(),
        });

        if (query) {
          queryParams.append("search", query);
        }

        if (currentSort) {
          queryParams.append("sortBy", currentSort);
          queryParams.append("sortOrder", sortOrder);
        }

        // Obtener filtros avanzados si la función está definida
        if (onApplyFilters) {
          const activeFilters = onApplyFilters();
          Object.entries(activeFilters).forEach(([key, val]) => {
            if (val) queryParams.append(key, val);
          });
        }

        const resData = await api.request(`${endpoint}?${queryParams.toString()}`);

        if (resData.success) {
          const items: T[] = resData.data.items || [];
          
          setData((prev) => {
            if (targetPage === 1 || isRefresh) {
              return items;
            }
            // Control estricto de duplicados
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = items.filter((item) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });

          // Determinar si hay más elementos
          setHasMore(items.length >= limit && resData.data.totalItems > (targetPage * limit));
        } else {
          setError(resData.message || "Error al obtener datos del servidor.");
        }
      } catch (err) {
        console.error("AppListView fetch error:", err);
        // Fallback de desarrollo con datos simulados si falla la conexión
        simulateDataFallback(targetPage, query, isRefresh);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [endpoint, limit, hasMore, currentSort, sortOrder, onApplyFilters]
  );

  // Fallback con mocks en caso de no poder conectar con la API en desarrollo
  const simulateDataFallback = (targetPage: number, query: string, isRefresh: boolean) => {
    if (endpoint === "/users" || endpoint === "users") {
      const mockUsers = [
        { id: "1", email: "admin@baseforge.com", firstName: "Super", lastName: "Admin", roles: ["SUPER_ADMIN"] },
        { id: "2", email: "tenant@baseforge.com", firstName: "Tenant", lastName: "Admin", roles: ["TENANT_ADMIN"] },
        { id: "3", email: "user1@baseforge.com", firstName: "Juan", lastName: "Pérez", roles: ["TENANT_USER"] },
        { id: "4", email: "user2@baseforge.com", firstName: "Maria", lastName: "Gomez", roles: ["TENANT_USER"] },
        { id: "5", email: "user3@baseforge.com", firstName: "Carlos", lastName: "Lopez", roles: ["TENANT_USER"] },
        { id: "6", email: "user4@baseforge.com", firstName: "Ana", lastName: "Rodriguez", roles: ["TENANT_USER"] },
      ];

      let filtered = mockUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(query.toLowerCase()) ||
          u.firstName.toLowerCase().includes(query.toLowerCase()) ||
          u.lastName.toLowerCase().includes(query.toLowerCase())
      );

      // Ordenar localmente para simulación
      if (currentSort === "name") {
        filtered.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`;
          const nameB = `${b.firstName} ${b.lastName}`;
          return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
      }

      setData((prev) => (targetPage === 1 || isRefresh ? (filtered as unknown as T[]) : [...prev]));
      setHasMore(false);
    } else if (endpoint === "notifications" || endpoint === "/notifications") {
      const mockNotifications = [
        {
          id: "1",
          type: "USER_WELCOME",
          title: "¡Bienvenido a BaseForge!",
          body: "Hola Juan, bienvenido a BaseForge Demo. Nos alegra tenerte en nuestro espacio de trabajo.",
          priority: "NORMAL",
          readAt: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          type: "PASSWORD_CHANGED",
          title: "Contraseña modificada",
          body: "Hola Juan, te confirmamos que la contraseña de tu cuenta ha sido modificada con éxito.",
          priority: "NORMAL",
          readAt: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "3",
          type: "TENANT_SUSPENDED",
          title: "Espacio de trabajo suspendido",
          body: "El espacio de trabajo BaseForge Demo ha sido suspendido temporalmente.",
          priority: "HIGH",
          readAt: null,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      let filtered = mockNotifications.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.body.toLowerCase().includes(query.toLowerCase())
      );

      setData((prev) => (targetPage === 1 || isRefresh ? (filtered as unknown as T[]) : [...prev]));
      setHasMore(false);
    } else {
      setError("No se pudo conectar con el servidor local.");
    }
  };


  // Disparar carga cuando cambian los filtros/búsqueda/ordenación
  useEffect(() => {
    setPage(1);
    fetchData(1, debouncedQuery);
  }, [debouncedQuery, currentSort, sortOrder]);

  // Pull to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchData(1, debouncedQuery, true);
  };

  // Carga de página siguiente (scroll infinito)
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, debouncedQuery);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleApplyFilters = () => {
    setFilterModalVisible(false);
    setPage(1);
    fetchData(1, debouncedQuery);
  };

  const handleClearFilters = () => {
    setFilterModalVisible(false);
    setPage(1);
    fetchData(1, debouncedQuery);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyEmoji, { color: colors.textMuted }]}>🔍</Text>
        <Text style={[styles.emptyText, { color: colors.text }]}>No se encontraron elementos</Text>
        <Text style={[styles.emptySub, { color: colors.textMuted }]}>
          Prueba ajustando tu búsqueda o filtros.
        </Text>
      </View>
    );
  };

  const renderSkeleton = () => {
    return (
      <View style={styles.skeletonContainer}>
        {[1, 2, 3].map((key) => (
          <View key={key} style={[styles.skeletonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.skeletonAvatar, { backgroundColor: isDark ? "#1e293b" : "#e2e8f0" }]} />
            <View style={styles.skeletonDetails}>
              <View style={[styles.skeletonLine, { width: "60%", backgroundColor: isDark ? "#1e293b" : "#e2e8f0" }]} />
              <View style={[styles.skeletonLine, { width: "40%", marginTop: 8, backgroundColor: isDark ? "#1e293b" : "#e2e8f0" }]} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.controlsRow}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {filterContent && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Fila de controles de Ordenación */}
      {sortFields && sortFields.length > 0 && (
        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: colors.textMuted }]}>Ordenar por:</Text>
          <View style={styles.sortOptions}>
            {sortFields.map((field) => (
              <TouchableOpacity
                key={field.value}
                style={[
                  styles.sortBadge,
                  {
                    backgroundColor: currentSort === field.value ? colors.primaryMuted : colors.card,
                    borderColor: currentSort === field.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  if (currentSort === field.value) {
                    toggleSortOrder();
                  } else {
                    setCurrentSort(field.value);
                    setSortOrder("asc");
                  }
                }}
              >
                <Text
                  style={[
                    styles.sortBadgeText,
                    {
                      color: currentSort === field.value ? colors.primaryText : colors.text,
                      fontWeight: currentSort === field.value ? "bold" : "normal",
                    },
                  ]}
                >
                  {field.label} {currentSort === field.value ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {error && (
        <View style={[styles.errorCard, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => fetchData(page, debouncedQuery)}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && data.length === 0 ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Bottom Sheet de Filtros integrado */}
      {filterContent && (
        <BottomSheetFilters
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        >
          {filterContent}
        </BottomSheetFilters>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  clearButton: {
    padding: 6,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 10,
  },
  sortOptions: {
    flexDirection: "row",
    flex: 1,
    flexWrap: "wrap",
  },
  sortBadge: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  sortBadgeText: {
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
  },
  errorCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
  },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  skeletonDetails: {
    flex: 1,
    marginLeft: 16,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 4,
  },
});
