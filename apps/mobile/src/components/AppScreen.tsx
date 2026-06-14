import React from "react";
import { StyleSheet, View, ScrollView, SafeAreaView, StatusBar, ViewStyle } from "react-native";
import { useTheme } from "../config/theme";

interface AppScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export default function AppScreen({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
}: AppScreenProps) {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.card}
      />
      {scrollable ? (
        <ScrollView
          style={[styles.container, style]}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, styles.flexContainer, style]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  flexContainer: {
    justifyContent: "flex-start",
  },
});
