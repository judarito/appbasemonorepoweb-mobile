import { z } from "zod";
import fs from "fs";
import path from "path";

// Cargar .env desde la raíz del monorepo si no está definido en el proceso
if (!process.env.DATABASE_URL) {
  try {
    const rootEnvPath = path.resolve(__dirname, "../../../../.env");
    if (fs.existsSync(rootEnvPath)) {
      const envContent = fs.readFileSync(rootEnvPath, "utf-8");
      envContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqualIndex = trimmed.indexOf("=");
          if (firstEqualIndex !== -1) {
            const key = trimmed.substring(0, firstEqualIndex).trim();
            let value = trimmed.substring(firstEqualIndex + 1).trim();
            // Eliminar comentarios de fin de línea
            const hashIndex = value.indexOf("#");
            if (hashIndex !== -1) {
              value = value.substring(0, hashIndex).trim();
            }
            value = value.replace(/^['"]|['"]$/g, "");
            process.env[key] = value;
          }
        }
      });
    }
  } catch (err) {
    console.warn("⚠️ Advertencia: No se pudo cargar el archivo .env de la raíz:", err);
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test", "staging"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url({ message: "DATABASE_URL debe ser una URL válida." }),
  JWT_ACCESS_SECRET: z.string().min(8, { message: "JWT_ACCESS_SECRET debe tener al menos 8 caracteres." }),
  JWT_REFRESH_SECRET: z.string().min(8, { message: "JWT_REFRESH_SECRET debe tener al menos 8 caracteres." }),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SENTRY_DSN: z.string().optional(),
  OTLP_ENDPOINT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error: any) {
  if (error instanceof z.ZodError) {
    console.error("❌ Error en la validación de variables de entorno:");
    error.errors.forEach((err) => {
      console.error(`   - ${err.path.join(".")}: ${err.message}`);
    });
  } else {
    console.error("❌ Error inesperado al validar variables de entorno:", error);
  }
  process.exit(1);
}

export { env };
