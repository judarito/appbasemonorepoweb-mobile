import { Sun, Moon } from "lucide-react";

interface ThemeSwitcherProps {
  theme: "dark" | "light";
  onToggle: () => void;
  size?: "sm" | "md";
}

/**
 * ThemeSwitcher — Botón para alternar entre tema claro y oscuro.
 *
 * @example
 * <ThemeSwitcher theme={theme} onToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
 */
export function ThemeSwitcher({ theme, onToggle, size = "md" }: ThemeSwitcherProps) {
  const sizePx = size === "sm" ? "2rem" : "2.5rem";
  return (
    <button
      onClick={onToggle}
      className="theme-toggle"
      aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
      style={{ width: sizePx, height: sizePx }}
    >
      {theme === "dark" ? <Sun size={size === "sm" ? 14 : 16} /> : <Moon size={size === "sm" ? 14 : 16} />}
    </button>
  );
}
