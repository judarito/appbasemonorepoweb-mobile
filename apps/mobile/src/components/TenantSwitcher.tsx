import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { useTheme } from "../config/theme";
import { useAuth } from "../context/AuthContext";

interface Tenant {
  id: string;
  name: string;
}

export default function TenantSwitcher() {
  const [modalVisible, setModalVisible] = useState(false);
  const { colors } = useTheme();
  const { user } = useAuth();

  // Mocks de Tenants asociados al usuario logueado en desarrollo
  const tenants: Tenant[] = [
    { id: "1", name: "Empresa Alfa SaaS" },
    { id: "2", name: "Corporativo Beta" },
  ];

  const [activeTenantId, setActiveTenantId] = useState("1");
  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  const handleSwitch = (tenantId: string) => {
    setActiveTenantId(tenantId);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.triggerButton,
          {
            backgroundColor: colors.primaryMuted,
            borderColor: colors.primary,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.triggerText, { color: colors.primaryText }]}>
          🏢 {activeTenant.name}
        </Text>
        <Text style={{ color: colors.primaryText, fontSize: 10, marginLeft: 8 }}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>Cambiar Espacio de Trabajo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.textMuted, fontSize: 20 }}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={tenants}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: item.id === activeTenantId ? colors.primaryMuted : "transparent",
                    },
                  ]}
                  onPress={() => handleSwitch(item.id)}
                >
                  <Text
                    style={[
                      styles.itemText,
                      {
                        color: item.id === activeTenantId ? colors.primaryText : colors.text,
                        fontWeight: item.id === activeTenantId ? "bold" : "normal",
                      },
                    ]}
                  >
                    🏢 {item.name}
                  </Text>
                  {item.id === activeTenantId && (
                    <Text style={{ color: colors.primary, fontWeight: "bold" }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
  },
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 14,
  },
});
