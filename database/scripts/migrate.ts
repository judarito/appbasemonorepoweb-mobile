#!/usr/bin/env bun
/**
 * Ejecuta migraciones de base de datos usando Drizzle Kit.
 *
 * Uso: bun run db:migrate
 */

import { $ } from "bun";

console.log("🗄️  Ejecutando migraciones de base de datos...");

const result = await $`drizzle-kit push --config=database/drizzle.config.ts`.nothrow();

if (result.exitCode === 0) {
  console.log("✅ Migraciones ejecutadas correctamente.");
} else {
  console.error("❌ Error al ejecutar migraciones.");
  console.error(result.stderr.toString());
  process.exit(1);
}
