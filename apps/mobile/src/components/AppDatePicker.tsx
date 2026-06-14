import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  ViewStyle,
} from "react-native";
import { useTheme } from "../config/theme";
import AppButton from "./AppButton";

interface AppDatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  style?: ViewStyle;
}

export default function AppDatePicker({
  label,
  value,
  onChange,
  error,
  style,
}: AppDatePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { colors } = useTheme();

  // Estados locales para la edición manual simplificada (Día, Mes, Año)
  const [day, setDay] = useState(value.getDate().toString());
  const [month, setMonth] = useState((value.getMonth() + 1).toString());
  const [year, setYear] = useState(value.getFullYear().toString());

  const handleOpen = () => {
    setDay(value.getDate().toString());
    setMonth((value.getMonth() + 1).toString());
    setYear(value.getFullYear().toString());
    setModalVisible(true);
  };

  const handleSave = () => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10) - 1;
    const y = parseInt(year, 10);

    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      const newDate = new Date(y, m, d);
      if (!isNaN(newDate.getTime())) {
        onChange(newDate);
      }
    }
    setModalVisible(false);
  };

  const formattedDate = `${value.getDate().toString().padStart(2, "0")}/${(value.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${value.getFullYear()}`;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.pickerButton,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        onPress={handleOpen}
      >
        <Text style={[styles.pickerButtonText, { color: colors.text }]}>
          {formattedDate}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 16 }}>📅</Text>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Seleccionar Fecha</Text>

            <View style={styles.inputsRow}>
              <View style={styles.inputCol}>
                <Text style={[styles.colLabel, { color: colors.textMuted }]}>Día</Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={day}
                  onChangeText={setDay}
                  textAlign="center"
                />
              </View>

              <View style={styles.inputCol}>
                <Text style={[styles.colLabel, { color: colors.textMuted }]}>Mes</Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={month}
                  onChangeText={setMonth}
                  textAlign="center"
                />
              </View>

              <View style={styles.inputCol}>
                <Text style={[styles.colLabel, { color: colors.textMuted }]}>Año</Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={4}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={year}
                  onChangeText={setYear}
                  textAlign="center"
                />
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: colors.text }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={{ color: "#ffffff", fontWeight: "bold" }}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  pickerButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerButtonText: {
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  inputCol: {
    alignItems: "center",
    width: "28%",
  },
  colLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    height: 44,
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    marginLeft: 12,
  },
});
