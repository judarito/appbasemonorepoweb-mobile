import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "../config/theme";

interface NotificationBadgeProps {
  count: number;
  style?: ViewStyle;
}

export default function NotificationBadge({ count, style }: NotificationBadgeProps) {
  const { colors } = useTheme();

  if (count <= 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <View style={[styles.badge, { backgroundColor: colors.error }, style]}>
      <Text style={styles.text}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    position: "absolute",
    right: -6,
    top: -6,
    zIndex: 10,
  },
  text: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
});
