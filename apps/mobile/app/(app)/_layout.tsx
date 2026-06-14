import { Tabs, useRouter } from "expo-router";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../src/config/theme";
import { useAuth } from "../../src/context/AuthContext";
import { NotificationBadge } from "../../src/components";
import React, { useState, useEffect } from "react";
import { api } from "../../src/config/api";

function HeaderNotificationsButton() {
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchUnreadCount = async () => {
    try {
      const res = await api.notifications.list({ page: 1, limit: 1 });
      if (res.success) {
        // Obtenemos solo el conteo de no leídas filtrando por readAt si el endpoint lo requiere,
        // pero dado que el total de items devuelto es para todas, podemos estimar el conteo
        // de no leídas haciendo una llamada o usando el total de la API.
        // El endpoint GET /api/v1/notifications en backend devuelve todas las del inquilino/usuario.
        // Vamos a filtrar las no leídas del listado si no tenemos un endpoint específico de unread count.
        // O mejor aún, el backend devuelve el totalItems, pero queremos contar las no leídas:
        // Contemos localmente o hagamos que totalItems represente las no leídas o consultemos un subconjunto.
        // Para simplificar, listamos las primeras 50 y contamos cuántas tienen readAt === null.
        const resList = await api.notifications.list({ page: 1, limit: 50 });
        if (resList.success) {
          const unread = (resList.data.items || []).filter((n: any) => !n.readAt).length;
          setUnreadCount(unread);
        }
      }
    } catch (err) {
      console.warn("Could not fetch unread notifications count:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push("/notifications")}
      style={{ marginRight: 16, position: "relative", padding: 4 }}
    >
      <Text style={{ fontSize: 20 }}>🔔</Text>
      <NotificationBadge count={unreadCount} style={{ right: -2, top: -2 }} />
    </TouchableOpacity>
  );
}

export default function AppLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const isAdmin = user?.roles?.some((role) =>
    ["SUPER_ADMIN", "TENANT_ADMIN"].includes(role)
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerRight: () => <HeaderNotificationsButton />,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarLabel: "Panel",
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: focused ? 20 : 18, fontWeight: "bold" }}>▤</Text>
          ),
        }}
      />
      
      {isAdmin && (
        <Tabs.Screen
          name="users"
          options={{
            title: "Usuarios",
            tabBarLabel: "Usuarios",
            tabBarIcon: ({ color, focused }) => (
              <Text style={{ color, fontSize: focused ? 20 : 18, fontWeight: "bold" }}>👥</Text>
            ),
          }}
        />
      )}

      <Tabs.Screen
        name="profile"
        options={{
          title: "Mi Perfil",
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: focused ? 20 : 18, fontWeight: "bold" }}>👤</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notificaciones",
          href: null, // Esconde el tab en la barra inferior
        }}
      />

      <Tabs.Screen
        name="files"
        options={{
          title: "Mis Archivos",
          href: null,
        }}
      />
    </Tabs>
  );
}

