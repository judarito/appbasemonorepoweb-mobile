import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";

export default function Home() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Cargando..." }} />
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>BF</Text>
        </View>
        <Text style={styles.title}>BaseForge SaaS</Text>
        <Text style={styles.subtitle}>Inicializando espacio de trabajo...</Text>
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 30 }} />
      </View>
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
  content: {
    alignItems: "center",
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
  },
});
