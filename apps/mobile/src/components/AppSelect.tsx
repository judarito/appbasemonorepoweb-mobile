import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  ViewStyle,
} from "react-native";
import { useTheme } from "../config/theme";

interface SelectOption {
  label: string;
  value: string;
}

interface AppSelectProps {
  label?: string;
  options: SelectOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  style?: ViewStyle;
}

export default function AppSelect({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder = "Seleccionar una opción...",
  error,
  style,
}: AppSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { colors } = useTheme();

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.selectButtonText,
            { color: selectedOption ? colors.text : colors.textMuted },
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>▼</Text>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {label || "Seleccionar Opcion"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={{ color: colors.textMuted, fontSize: 20 }}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: item.value === selectedValue ? colors.primaryMuted : "transparent",
                    },
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: item.value === selectedValue ? colors.primaryText : colors.text,
                        fontWeight: item.value === selectedValue ? "bold" : "normal",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
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
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  selectButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectButtonText: {
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    maxHeight: "60%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 15,
  },
});
