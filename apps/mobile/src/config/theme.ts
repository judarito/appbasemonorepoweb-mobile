import { useColorScheme } from "react-native";

export const themeColors = {
  dark: {
    background: "#0b0f19",
    card: "#0f172a",
    border: "#1e293b",
    text: "#ffffff",
    textMuted: "#94a3b8",
    primary: "#2563eb",
    primaryMuted: "#1e3a8a",
    primaryText: "#60a5fa",
    error: "#ef4444",
    errorBg: "#ef444415",
    success: "#22c55e",
    successBg: "#22c55e15",
  },
  light: {
    background: "#f8fafc",
    card: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    textMuted: "#64748b",
    primary: "#2563eb",
    primaryMuted: "#dbeafe",
    primaryText: "#2563eb",
    error: "#ef4444",
    errorBg: "#fef2f2",
    success: "#16a34a",
    successBg: "#f0fdf4",
  },
};

export function useTheme() {
  const systemScheme = useColorScheme();
  const scheme = systemScheme === "light" ? "light" : "dark";
  return {
    colors: themeColors[scheme],
    scheme,
    isDark: scheme === "dark",
  };
}
