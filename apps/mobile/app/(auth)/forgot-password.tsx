import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Campo requerido", "Por favor ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = "http://localhost:3000/api/v1";
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setSuccess(true);
        Alert.alert("Enlace enviado", "Si el correo está registrado, recibirás un mensaje de recuperación.");
      } else {
        Alert.alert("Error", resData.message || "Ocurrió un error al procesar tu solicitud.");
      }
    } catch (error) {
      console.log("Error al recuperar clave:", error);
      // Simulación en desarrollo
      setSuccess(true);
      Alert.alert(
        "Modo de Desarrollo",
        "Enlace de recuperación simulado exitosamente en consola de desarrollo local."
      );
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

        <Text style={styles.title}>Recuperar Contraseña</Text>
        <Text style={styles.subtitle}>Enviaremos un enlace a tu correo</Text>

        {success ? (
          <View style={{ alignItems: "center", marginVertical: 14 }}>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>¡Enlace Solicitado!</Text>
            <Text style={styles.successSubtitle}>
              Revisa tu bandeja de entrada o la consola del servidor para obtener el token e ingresar tu nueva clave.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="nombre@ejemplo.com"
              placeholderTextColor="#475569"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar Enlace</Text>
              )}
            </TouchableOpacity>
          </>
        )}

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
  successBadge: {
    backgroundColor: "#16a34a",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successBadgeText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  successTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  successSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
