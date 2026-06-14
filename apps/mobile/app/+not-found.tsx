import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { useTheme } from "../src/config/theme";

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Ups!", headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.emoji, { color: colors.primary }]}>🚧</Text>
        <Text style={[styles.title, { color: colors.text }]}>Página no encontrada</Text>
        <Text style={[styles.message, { color: colors.textMuted }]}>
          Lo sentimos, la pantalla que estás intentando buscar no existe o ha sido movida.
        </Text>
        
        <Link href="/(app)/dashboard" replace asChild>
          <View style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={styles.buttonText}>Regresar al Dashboard</Text>
          </View>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
