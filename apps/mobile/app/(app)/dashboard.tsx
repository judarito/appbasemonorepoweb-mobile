import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Share, Alert } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { MENU_ITEMS } from "../../src/config/menu.config";

export default function Dashboard() {
  const { user } = useAuth();

  const handleShare = async () => {
    try {
      await Share.share({
        message: "¡Hola! Estoy usando BaseForge SaaS. Únete a mi espacio de trabajo.",
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Filtrar ítems de menú según roles del usuario para renderizado dinámico de módulos
  const allowedModules = MENU_ITEMS.filter((item) => {
    if (!item.rolesRequired) return false; // Excluir dashboard y profile de la grilla de administración interna
    return item.rolesRequired.some((role) => user?.roles?.includes(role));
  });

  const handleModulePress = (moduleName: string) => {
    Alert.alert("Módulo en Desarrollo", `El módulo de ${moduleName} estará disponible próximamente en móvil.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>¡Bienvenido de nuevo!</Text>
        <Text style={styles.welcomeEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {user?.roles?.join(", ") || "TENANT_USER"}
          </Text>
        </View>
      </View>

      {/* Grilla dinámica de Módulos de Administración según permisos */}
      {allowedModules.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Módulos Administrativos</Text>
          <View style={styles.grid}>
            {allowedModules.map((module, index) => (
              <TouchableOpacity
                key={index}
                style={styles.moduleCard}
                onPress={() => handleModulePress(module.label)}
              >
                <Text style={styles.moduleEmoji}>{module.emoji}</Text>
                <Text style={styles.moduleLabel}>{module.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Métricas del Espacio</Text>
      
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>👥</Text>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Usuarios Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🛡️</Text>
          <Text style={styles.statValue}>4</Text>
          <Text style={styles.statLabel}>Roles Asignados</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={styles.statValue}>99.9%</Text>
          <Text style={styles.statLabel}>Disponibilidad</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📥</Text>
          <Text style={styles.statValue}>2.4k</Text>
          <Text style={styles.statLabel}>Peticiones Hoy</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

      <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
        <Text style={styles.actionButtonEmoji}>🔗</Text>
        <View style={styles.actionButtonDetails}>
          <Text style={styles.actionButtonTitle}>Invitar Compañero</Text>
          <Text style={styles.actionButtonSub}>Comparte el enlace de acceso</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]}>
        <Text style={styles.actionButtonEmoji}>⚙️</Text>
        <View style={styles.actionButtonDetails}>
          <Text style={styles.actionButtonTitle}>Configuración del Sitio</Text>
          <Text style={styles.actionButtonSub}>Gestionar variables del tenant</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 24,
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  welcomeEmail: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 16,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  roleBadgeText: {
    color: "#60a5fa",
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    width: "48%",
    alignItems: "center",
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
  },
  moduleCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    width: "48%",
    alignItems: "center",
    marginBottom: 12,
  },
  moduleEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  moduleLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  actionButtonDetails: {
    flex: 1,
  },
  actionButtonTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  actionButtonSub: {
    color: "#64748b",
    fontSize: 12,
  },
});
