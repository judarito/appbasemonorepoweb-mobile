import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "../config/theme";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export default function AppInput({
  label,
  error,
  containerStyle,
  inputStyle,
  ...textInputProps
}: AppInputProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }, inputStyle]}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          {...textInputProps}
        />
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
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
  inputWrapper: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    height: "100%",
    width: "100%",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
