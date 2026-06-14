import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { api } from "../../src/config/api";
import { useTheme } from "../../src/config/theme";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: string;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { colors } = useTheme();

  const fetchNotifications = async (pageToFetch: number, isRefresh = false) => {
    try {
      const res = await api.notifications.list({ page: pageToFetch, limit: 15 });
      if (res.success) {
        const items = res.data.items as NotificationItem[];
        if (isRefresh || pageToFetch === 1) {
          setNotifications(items);
        } else {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newItems = items.filter((n) => !existingIds.has(n.id));
            return [...prev, ...newItems];
          });
        }
        setHasMore(items.length >= 15);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    try {
      await api.notifications.markAsRead(id);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      "Marcar todas",
      "¿Estás seguro de que deseas marcar todas las notificaciones como leídas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setNotifications((prev) =>
              prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
            );
            try {
              await api.notifications.markAllAsRead();
            } catch (err) {
              console.error("Error marking all notifications as read:", err);
            }
          },
        },
      ]
    );
  };

  const formatRelativeDate = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${diffDays} d`;
  };

  const renderNotificationCard = ({ item }: { item: NotificationItem }) => {
    const isUnread = !item.readAt;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => isUnread && handleMarkAsRead(item.id)}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isUnread ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            <Text style={[styles.title, { color: colors.text, fontWeight: isUnread ? "bold" : "600" }]}>
              {item.title}
            </Text>
          </View>
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {formatRelativeDate(item.createdAt)}
          </Text>
        </View>
        <Text style={[styles.body, { color: colors.text }]}>{item.body}</Text>
        {item.priority === "HIGH" && (
          <View style={[styles.priorityBadge, { backgroundColor: colors.error + "20", borderColor: colors.error }]}>
            <Text style={[styles.priorityText, { color: colors.error }]}>ALTA</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notificaciones</Text>
        {notifications.some((n) => !n.readAt) && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Marcar todo leído</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No tienes notificaciones</Text>
              <Text style={{ color: colors.textMuted, textAlign: "center" }}>
                Te avisaremos cuando pase algo importante.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
  },
  date: {
    fontSize: 11,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  priorityBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 10,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
});
