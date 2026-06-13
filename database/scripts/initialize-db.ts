import postgres from "postgres";
import fs from "fs";
import path from "path";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ Error: La variable de entorno DATABASE_URL no está definida.");
  process.exit(1);
}

// Configurar SSL de forma dinámica basado en la cadena de conexión
const isSslRequired = dbUrl.includes("sslmode=require") || process.env.DB_SSL === "true";
const sql = postgres(dbUrl, {
  max: 1,
  ssl: isSslRequired ? "require" : undefined,
});

async function main() {
  try {
    const migrationPath = path.resolve(__dirname, "../migrations/001_baseforge_initial_migration.sql");
    const seedPath = path.resolve(__dirname, "../seeds/002_baseforge_seed_data.sql");

    console.log(`📖 Leyendo archivo de migración: ${path.basename(migrationPath)}`);
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    console.log(`📖 Leyendo archivo de semillas: ${path.basename(seedPath)}`);
    const seedSql = fs.readFileSync(seedPath, "utf8");

    console.log("🧹 Limpiando esquema existente para instalación limpia...");
    await sql.unsafe("DROP SCHEMA IF EXISTS app CASCADE;");
    console.log("✅ Esquema app eliminado.");

    console.log("⚡ Ejecutando migración inicial en PostgreSQL...");
    // unsafe permite ejecutar múltiples consultas/statements separados por punto y coma en un solo bloque
    await sql.unsafe(migrationSql);
    console.log("✅ Migración aplicada exitosamente.");

    console.log("⚡ Cargando datos base (seeds)...");
    await sql.unsafe(seedSql);
    console.log("✅ Datos base cargados exitosamente.");

  } catch (error) {
    console.error("❌ Error durante la inicialización de la base de datos:");
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log("🔌 Conexión a la base de datos cerrada.");
  }
}

main();
