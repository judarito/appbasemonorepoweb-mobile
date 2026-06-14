import React from "react";
import { StyleSheet, Text, View, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../config/theme";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | string;
  label?: string;
  style?: ViewStyle;
}

export default function StatusBadge({ status, label, style }: StatusBadgeProps) {
  const { colors } = useTheme();

  const getBadgeStyles = (): { badge: ViewStyle; text: TextStyle } => {
    const norm = status.toLowerCase();
    switch (norm) {
      case "active":
      case "enabled":
      case "success":
        return {
          badge: { backgroundColor: colors.successBg, borderColor: colors.success },
          text: { color: colors.success },
        };
      case "inactive":
      case "disabled":
      case "danger":
        return {
          badge: { backgroundColor: colors.errorBg, borderColor: colors.error },
          text: { color: colors.error },
        };
      case "pending":
      case "warning":
      default:
        return {
          badge: { backgroundColor: "#fef3c7", borderColor: "#d97706" }, // Tonos cálidos de ámbar/naranja para advertencias
          text: { color: "#b45309" },
        };
    }
  };

  const config = getBadgeStyles();
  const textLabel = label || status.toUpperCase();

  return (
    <View style={[styles.badge, config.badge, style]}>
      <Text style={[styles.text, config.text]}>{textLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: "bold",
  },
});
