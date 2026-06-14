#!/usr/bin/env bun
/**
 * Ejecuta los seeds de base de datos.
 *
 * Uso: bun run db:seed
 *
 * Lee los archivos SQL de database/seeds/ y los ejecuta en orden numérico.
 * Es IDEMPOTENTE: usa INSERT ... ON CONFLICT DO NOTHING para no duplicar.
 */

import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { db, initializeDatabase } from "../../apps/api/src/database/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🌱 Sembrando datos iniciales...");

  await initializeDatabase();

  const seedsDir = resolve(__dirname, "../seeds");
  const files = readdirSync(seedsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("⚠️  No se encontraron archivos de seed.");
    process.exit(0);
  }

  for (const file of files) {
    const filePath = resolve(seedsDir, file);
    const content = readFileSync(filePath, "utf-8");
    console.log(`   ${file}...`);

    try {
      // Ejecutar cada sentencia por separado
      const statements = content
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const stmt of statements) {
        await db.execute(sql.raw(stmt));
      }
      console.log(`   ✅ ${file}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ ${file}: ${msg}`);
      process.exit(1);
    }
  }

  console.log("✅ Seeds ejecutados correctamente.");
  process.exit(0);
}

main();
