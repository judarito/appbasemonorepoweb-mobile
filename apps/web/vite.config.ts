/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Advertir si algún chunk supera 600kB tras gzip
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        /**
         * Separación manual de chunks para optimizar caché del navegador.
         * Los vendors pesados cambian raramente — se cachean de forma independiente
         * del código de la aplicación.
         */
        manualChunks: (id: string) => {
          // React runtime — chunk más estable, raramente cambia
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }

          // React Router
          if (id.includes("node_modules/react-router")) {
            return "vendor-router";
          }

          // Zustand (estado global)
          if (id.includes("node_modules/zustand")) {
            return "vendor-state";
          }

          // Lucide icons — suele ser el chunk más grande en dashboards
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }

          // Resto de node_modules (recharts, axios, etc.)
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/test/setup.ts",
  },
});
