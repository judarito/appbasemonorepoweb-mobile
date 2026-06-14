import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../config/theme";

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export default function ScreenHeader({
  title,
  showBackButton = false,
  rightAction,
  style,
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backIcon, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {rightAction && (
        <TouchableOpacity onPress={rightAction.onPress} style={styles.rightButton}>
          <Text style={[styles.rightButtonText, { color: colors.primary }]}>
            {rightAction.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  rightButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rightButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
