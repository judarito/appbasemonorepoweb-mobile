import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "../config/theme";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: AppButtonProps) {
  const { colors } = useTheme();

  // Configurar estilos basados en la variante
  const getButtonStyles = (): ViewStyle => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case "danger":
        return {
          backgroundColor: colors.error,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case "primary":
      default:
        return {
          backgroundColor: colors.primary,
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case "secondary":
        return colors.text;
      case "outline":
        return colors.primary;
      case "primary":
      case "danger":
      default:
        return "#ffffff";
    }
  };

  const isBtnDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyles(),
        isBtnDisabled && { opacity: 0.6 },
        style,
      ]}
      onPress={onPress}
      disabled={isBtnDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
  },
  text: {
    fontSize: 15,
    fontWeight: "bold",
  },
});
