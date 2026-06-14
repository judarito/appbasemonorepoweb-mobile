import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/config/theme";
import ConnectivityBanner from "../src/components/ConnectivityBanner";
import { useEffect } from "react";

function NavigationLayout() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (loading) return;

    // Detectar si el usuario está en el grupo protegido (app)
    const inAppGroup = segments[0] === "(app)";

    if (!token && inAppGroup) {
      // Redirigir a la pantalla de Login si no está autenticado
      router.replace("/(auth)/login");
    } else if (token && !inAppGroup) {
      // Redirigir a la pantalla de Dashboard si ya está autenticado
      router.replace("/(app)/dashboard");
    }
  }, [token, loading, segments]);

  return (
    <>
      <ConnectivityBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <NavigationLayout />
    </AuthProvider>
  );
}
