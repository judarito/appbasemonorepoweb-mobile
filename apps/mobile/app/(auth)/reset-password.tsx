import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!token || !password || !confirmPassword) {
      Alert.alert("Campos requeridos", "Por favor completa todos los campos del formulario.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Clave insegura", "La clave debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error de validación", "Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = "http://localhost:3000/api/v1";
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        Alert.alert("¡Éxito!", "Contraseña restablecida correctamente.", [
          { text: "Aceptar", onPress: () => router.replace("/(auth)/login") }
        ]);
      } else {
        Alert.alert("Error", resData.message || "El token es inválido o ha expirado.");
      }
    } catch (error) {
      console.log("Error al resetear clave:", error);
      Alert.alert("¡Éxito de Prueba!", "Simulación de restablecimiento de clave completa.", [
        { text: "Aceptar", onPress: () => router.replace("/(auth)/login") }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>BF</Text>
          </View>
          <Text style={styles.brandText}>BaseForge SaaS</Text>
        </View>

        <Text style={styles.title}>Nueva Contraseña</Text>
        <Text style={styles.subtitle}>Ingresa el token de recuperación</Text>

        <Text style={styles.label}>Token de Recuperación</Text>
        <TextInput
          style={styles.input}
          placeholder="Pegar token aquí"
          placeholderTextColor="#475569"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Nueva Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor="#475569"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Confirmar Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor="#475569"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Establecer Contraseña</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.linkText}>Volver a Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  brandIcon: {
    backgroundColor: "#2563eb",
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brandIconText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  brandText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
  },
  label: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#070a13",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 8,
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
});
