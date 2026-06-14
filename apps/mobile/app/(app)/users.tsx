import React from "react";
import { StyleSheet, Text, View, Alert } from "react-native";
import AppListView from "../../src/components/AppListView";
import { useTheme } from "../../src/config/theme";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export default function UsersScreen() {
  const { colors } = useTheme();

  const handleUserPress = (user: UserItem) => {
    Alert.alert(
      "Usuario Seleccionado",
      `Nombre: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nRoles: ${user.roles.join(", ")}`
    );
  };

  const renderUserCard = ({ item }: { item: UserItem }) => {
    const initials = `${item.firstName?.[0] || ""}${item.lastName?.[0] || ""}`.toUpperCase() || item.email[0].toUpperCase();

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.details}>
            <Text style={[styles.name, { color: colors.text }]} onPress={() => handleUserPress(item)}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={[styles.email, { color: colors.textMuted }]}>{item.email}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.rolesContainer}>
            {item.roles.map((role, index) => (
              <View
                key={index}
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: colors.primaryMuted,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.roleText, { color: colors.primaryText }]}>
                  {role}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppListView<UserItem>
        endpoint="/users"
        renderItem={renderUserCard}
        searchPlaceholder="Buscar por nombre o email..."
        limit={10}
        sortFields={[{ label: "Nombre", value: "name" }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  email: {
    fontSize: 13,
    marginTop: 2,
  },
  cardFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 12,
  },
  rolesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  roleBadge: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "bold",
  },
});
