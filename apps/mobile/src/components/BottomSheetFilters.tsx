import React from "react";
import { StyleSheet, Text, View, Modal, TouchableOpacity } from "react-native";
import { useTheme } from "../config/theme";
import AppButton from "./AppButton";

interface BottomSheetFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

export default function BottomSheetFilters({
  visible,
  onClose,
  onApply,
  onClear,
  children,
}: BottomSheetFiltersProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Filtros Avanzados</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: colors.textMuted, fontSize: 22 }}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {children}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <AppButton
              title="Limpiar"
              variant="secondary"
              onPress={onClear}
              style={{ flex: 1, marginRight: 12 }}
            />
            <AppButton
              title="Aplicar"
              variant="primary"
              onPress={onApply}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
  },
});
