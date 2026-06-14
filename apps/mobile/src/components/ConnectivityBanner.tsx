import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Animated } from "react-native";
import { useTheme } from "../config/theme";

export default function ConnectivityBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const { colors } = useTheme();

  useEffect(() => {
    let interval: any;

    const checkConnectivity = async () => {
      try {
        // Ping a un servidor DNS público rápido o a la API de desarrollo local
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch("https://clients3.google.com/generate_204", {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (response.ok) {
          if (isOffline) {
            // Animación de salida gradual al volver a estar online
            setIsOffline(false);
            Animated.timing(animation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        } else {
          throw new Error("Sin internet");
        }
      } catch (err) {
        if (!isOffline) {
          setIsOffline(true);
          Animated.timing(animation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }
    };

    // Verificar inmediatamente y luego cada 8 segundos
    checkConnectivity();
    interval = setInterval(checkConnectivity, 8000);

    return () => clearInterval(interval);
  }, [isOffline]);

  if (!isOffline) return null;

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }], backgroundColor: colors.error }]}>
      <Text style={styles.text}>⚠️ Sin conexión a internet. Verificando red...</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    paddingHorizontal: 16,
    flexDirection: "row",
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
});
