import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

export default function Home() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Inicio" }} />
      <Text style={styles.title}>BaseForge Mobile</Text>
      <Text style={styles.subtitle}>Fase 2 de la aplicación base móvil activa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
});
