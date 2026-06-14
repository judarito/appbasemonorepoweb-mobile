#!/usr/bin/env bun
/**
 * BaseForge SaaS — Fork Generator (Fase 32)
 *
 * Crea un nuevo proyecto SaaS a partir de la plantilla BaseForge.
 *
 * Uso:
 *   bun run create-app --name mi-app --display-name "Mi App"
 *
 * Opciones:
 *   --name           Nombre técnico (kebab-case). Obligatorio.
 *   --display-name   Nombre visible. Obligatorio.
 *   --slug           Slug para URLs. Opcional: por defecto = name.
 *   --author         Autor del fork. Opcional.
 *   --description    Descripción corta. Opcional.
 *
 * Ejemplo:
 *   bun run create-app \
 *     --name ofirone \
 *     --display-name "OfirOne" \
 *     --author "Juan Pérez" \
 *     --description "SaaS para gestión de inventarios"
 *
 * Requisitos:
 *   - Ejecutar DENTRO del repositorio clonado (modifica archivos in-place).
 *   - Tener Bun instalado.
 */

import { $ } from "bun";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dir, "..");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Parsear argumentos (BF-3201)
// ─────────────────────────────────────────────────────────────────────────────
interface Args {
  name: string;
  displayName: string;
  slug: string;
  author: string;
  description: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const name = get("--name");
  const displayName = get("--display-name");

  if (!name) {
    console.error("❌ Error: --name es obligatorio (ej: --name ofirone)");
    process.exit(1);
  }
  if (!displayName) {
    console.error("❌ Error: --display-name es obligatorio (ej: --display-name 'OfirOne')");
    process.exit(1);
  }

  return {
    name: name.toLowerCase().replace(/\s+/g, "-"),
    displayName,
    slug: get("--slug") || name.toLowerCase().replace(/\s+/g, "-"),
    author: get("--author") || "",
    description: get("--description") || `Fork de BaseForge SaaS — ${displayName}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Validar nombres (BF-3203)
// ─────────────────────────────────────────────────────────────────────────────
function validateNames(args: Args): void {
  const errors: string[] = [];

  if (!/^[a-z][a-z0-9-]*$/.test(args.name))
    errors.push("--name debe empezar con letra y contener solo [a-z0-9-]");
  if (args.name.length < 2 || args.name.length > 50)
    errors.push("--name debe tener entre 2 y 50 caracteres");
  if (args.displayName.length < 2 || args.displayName.length > 100)
    errors.push("--display-name debe tener entre 2 y 100 caracteres");
  if (!/^[a-z][a-z0-9-]*$/.test(args.slug))
    errors.push("--slug debe empezar con letra y contener solo [a-z0-9-]");

  if (errors.length > 0) {
    console.error("❌ Errores de validación:");
    errors.forEach((e) => console.error(`   • ${e}`));
    process.exit(1);
  }
  console.log("✅ Nombres válidos");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Reemplazar en archivos (BF-3204, BF-3205)
// ─────────────────────────────────────────────────────────────────────────────
const REPLACEMENTS = [
  ["BaseForge SaaS", "{DISPLAY_NAME}"],
  ["baseforge_postgres", "{NAME}_postgres"],
  ["baseforge_user", "{NAME}_user"],
  ["baseforge_password", "{NAME}_password"],
  ["baseforge_db", "{NAME}_db"],
  ["BaseForge", "{PASCAL_NAME}"],
  ["baseforge", "{SLUG}"],
  ["@baseforge/", "@{SLUG}/"],
] as const;

function toPascalCase(s: string): string {
  return s.split(/[-_\s]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

function getFileList(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...getFileList(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function replaceInFile(filePath: string, oldVal: string, newVal: string): number {
  if (!existsSync(filePath)) return 0;
  const content = readFileSync(filePath, "utf-8");
  if (!content.includes(oldVal)) return 0;
  writeFileSync(filePath, content.split(oldVal).join(newVal), "utf-8");
  return 1;
}

function replaceProjectNames(args: Args): void {
  console.log("\n📝 Reemplazando nombres del proyecto...");

  const files = getFileList(ROOT);
  const pascalName = toPascalCase(args.name);
  let count = 0;

  for (const file of files) {
    for (const [oldVal, template] of REPLACEMENTS) {
      const newVal = template
        .replace("{DISPLAY_NAME}", args.displayName)
        .replace("{NAME}", args.name)
        .replace("{PASCAL_NAME}", pascalName)
        .replace("{SLUG}", args.slug);
      count += replaceInFile(file, oldVal, newVal);
    }
  }

  console.log(`   ✅ ${count} reemplazos en ${files.length} archivos`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Actualizar mobile IDs (BF-3205)
// ─────────────────────────────────────────────────────────────────────────────
function updateMobileIds(args: Args): void {
  const p = resolve(ROOT, "apps/mobile/app.json");
  if (!existsSync(p)) return;
  let content = readFileSync(p, "utf-8");
  content = content
    .replace(/"name": ".*?"/, `"name": "${args.displayName}"`)
    .replace(/"slug": ".*?"/, `"slug": "${args.slug}-mobile"`)
    .replace(/"scheme": ".*?"/, `"scheme": "${args.slug}"`);
  writeFileSync(p, content, "utf-8");
  console.log("   ✅ app.json (mobile) actualizado");
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Regenerar .env (BF-3207)
// ─────────────────────────────────────────────────────────────────────────────
function generateEnv(args: Args): void {
  const examplePath = resolve(ROOT, ".env.example");
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(examplePath)) return;
  let content = readFileSync(examplePath, "utf-8");
  content = content
    .replace(/baseforge_user/g, `${args.name}_user`)
    .replace(/baseforge_password/g, `${args.name}_password`)
    .replace(/baseforge_db/g, `${args.name}_db`);
  writeFileSync(envPath, content, "utf-8");
  writeFileSync(examplePath, content, "utf-8");
  console.log("   ✅ .env y .env.example generados");
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Migración del dominio (BF-3209)
// ─────────────────────────────────────────────────────────────────────────────
function createDomainMigration(args: Args): void {
  const tsContent = `import { pgSchema } from "drizzle-orm/pg-core";

/**
 * Schema del dominio de ${args.displayName}
 * Generado por BaseForge Fork Generator el ${new Date().toISOString().split("T")[0]}
 */
export const ${args.slug}Schema = pgSchema("${args.slug}");

// --- Agregar tablas del dominio aquí ---
// export const myEntities = ${args.slug}Schema.table("my_entities", { ... });
`;

  const tsPath = resolve(ROOT, `apps/api/src/database/${args.slug}-schema.ts`);
  writeFileSync(tsPath, tsContent, "utf-8");

  const sqlPath = resolve(ROOT, `database/migrations/003_${args.slug}_domain.sql`);
  writeFileSync(sqlPath, `-- Migration: Dominio de ${args.displayName}\n-- Fecha: ${new Date().toISOString().split("T")[0]}\n-- Schema: ${args.slug}\n\n`, "utf-8");

  console.log(`   ✅ Schema TS: ${tsPath}`);
  console.log(`   ✅ Migración SQL: ${sqlPath}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Documentación del fork (BF-3214)
// ─────────────────────────────────────────────────────────────────────────────
function createForkDocs(args: Args): void {
  const readme = `# ${args.displayName}

> Fork de BaseForge SaaS · ${new Date().toISOString().split("T")[0]}
${args.author ? `> Autor: ${args.author}` : ""}

${args.description}

## Stack

- **Runtime:** Bun
- **API:** Bun + Hono + TypeScript
- **Web:** React + Vite + TypeScript
- **Mobile:** React Native + Expo
- **DB:** PostgreSQL + Drizzle ORM

## Comandos

| Comando | Descripción |
|---|---|
| \`bun run dev\` | Iniciar desarrollo |
| \`bun run build\` | Compilar |
| \`bun run test\` | Pruebas |
| \`bun run db:migrate\` | Migraciones |
| \`bun run db:seed\` | Sembrar datos |

## Mantenerse actualizado

Ver [docs/development/fork-update-guide.md](docs/development/fork-update-guide.md)
para instrucciones sobre cómo recibir actualizaciones de la plantilla BaseForge.
`;

  writeFileSync(resolve(ROOT, "README.md"), readme, "utf-8");
  console.log("   ✅ README.md regenerado");
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Instalar dependencias (BF-3210)
// ─────────────────────────────────────────────────────────────────────────────
async function runInstall(): Promise<void> {
  console.log("\n📦 Instalando dependencias...");
  try {
    const result = await $`cd ${ROOT} && bun install`.quiet();
    if (result.exitCode === 0) console.log("   ✅ bun install completado");
    else console.warn("   ⚠ bun install tuvo problemas");
  } catch {
    console.warn("   ⚠ bun install falló. Ejecutar manualmente: bun install");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Commit inicial (BF-3213)
// ─────────────────────────────────────────────────────────────────────────────
async function createInitialCommit(args: Args): Promise<void> {
  console.log("\n🔨 Creando commit inicial...");
  try {
    await $`cd ${ROOT} && git add -A`.quiet();
    const result = await $`cd ${ROOT} && git commit -m "chore: init ${args.name} — fork de BaseForge SaaS"`.quiet();
    if (result.exitCode === 0) console.log("   ✅ Commit creado");
    else console.warn("   ⚠ Git commit falló");
  } catch {
    console.warn("   ⚠ Git no disponible o repo no inicializado");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Resumen
// ─────────────────────────────────────────────────────────────────────────────
function printSummary(args: Args): void {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  🎉 Fork creado: ${args.displayName}`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Nombre:     ${args.name}`);
  console.log(`  Display:    ${args.displayName}`);
  console.log(`  Slug:       ${args.slug}`);
  console.log(`  Ruta:       ${ROOT}`);
  console.log(``);
  console.log(`  Próximos pasos:`);
  console.log(`  1. Revisar archivos modificados con git diff`);
  console.log(`  2. Agregar tablas del dominio en database/migrations/`);
  console.log(`  3. Ejecutar bun run dev`);
  console.log(`  4. Personalizar branding`);
  console.log(`  5. Elegir módulos opcionales`);
  console.log(`  6. Desplegar (ver docs/development/deployment.md)`);
  console.log(`${"═".repeat(60)}\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`\n${"═".repeat(60)}`);
  console.log("  🏗️  BaseForge SaaS — Fork Generator");
  console.log(`  Fase 32`);
  console.log(`${"═".repeat(60)}\n`);

  const args = parseArgs();

  console.log(`📋 Configuración:`);
  console.log(`   • Nombre:        ${args.name}`);
  console.log(`   • Display name:  ${args.displayName}`);
  console.log(`   • Slug:          ${args.slug}`);
  if (args.author) console.log(`   • Autor:         ${args.author}`);

  validateNames(args);
  replaceProjectNames(args);
  updateMobileIds(args);
  generateEnv(args);
  createDomainMigration(args);
  createForkDocs(args);
  await runInstall();
  await createInitialCommit(args);
  printSummary(args);
}

main();
