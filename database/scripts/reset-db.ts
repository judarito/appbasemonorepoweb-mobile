#!/usr/bin/env bun
/**
 * Resetea completamente la base de datos: drop schema, migrate y seed.
 *
 * Uso: bun run db:reset
 *
 * ⚠️  PELIGRO: Elimina TODOS los datos existentes.
 */

import { $ } from "bun";
import { db, initializeDatabase } from "../../apps/api/src/database/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("⚠️  ═══════════════════════════════════════");
  console.log("⚠️   RESET TOTAL DE BASE DE DATOS");
  console.log("⚠️   Todos los datos serán eliminados.");
  console.log("⚠️  ═══════════════════════════════════════\n");

  // 1. Drop schema
  console.log("🗑️  Eliminando schema existente...");
  await initializeDatabase();
  await db.execute(sql`DROP SCHEMA IF EXISTS app CASCADE`);
  console.log("   ✅ Schema eliminado.\n");

  // 2. Migrate
  console.log("🗄️  Ejecutando migraciones...");
  const migrate = await $`drizzle-kit push --config=database/drizzle.config.ts`.nothrow();
  if (migrate.exitCode !== 0) {
    console.error("❌ Error en migraciones:", migrate.stderr.toString());
    process.exit(1);
  }
  console.log("   ✅ Migraciones ejecutadas.\n");

  // 3. Seed
  console.log("🌱 Ejecutando seeds...");
  const seed = await $`bun run database/scripts/seed.ts`.nothrow();
  if (seed.exitCode !== 0) {
    console.error("❌ Error en seeds:", seed.stderr.toString());
    process.exit(1);
  }
  console.log("   ✅ Seeds ejecutados.\n");

  console.log("✅ Base de datos restaurada correctamente.");
  process.exit(0);
}

main();
