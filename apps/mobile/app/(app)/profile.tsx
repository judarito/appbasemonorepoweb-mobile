import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas cerrar tu sesión en BaseForge?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar Sesión", style: "destructive", onPress: () => logout() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Usuario BaseForge"}
        </Text>
        <Text style={styles.email}>{user?.email || "sin_correo@baseforge.local"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detalles de Cuenta</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Identificador</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {user?.id || "N/A"}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Roles Asignados</Text>
          <Text style={styles.rowValue}>
            {user?.roles?.join(", ") || "Ninguno"}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
    padding: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginVertical: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#1e293b",
  },
  avatarText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    color: "#64748b",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 24,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowLabel: {
    color: "#94a3b8",
    fontSize: 14,
  },
  rowValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    maxWidth: "60%",
  },
  separator: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 4,
  },
  logoutButton: {
    backgroundColor: "#ef444415",
    borderWidth: 1,
    borderColor: "#ef444440",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 16,
  },
});
