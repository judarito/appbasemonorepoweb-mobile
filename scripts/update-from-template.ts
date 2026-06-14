#!/usr/bin/env bun
/**
 * BaseForge SaaS — Actualización Automática desde Plantilla (Fase 33)
 *
 * Automatiza el proceso de actualizar un fork con los últimos cambios de la
 * plantilla BaseForge.
 *
 * Uso:
 *   bun run scripts/update-from-template.ts
 *
 * Opciones:
 *   --dry-run         Mostrar lo que se haría sin ejecutarlo
 *   --tag <version>   Tag específico a mergear (ej: v1.1.0)
 *   --yes             Omitir confirmación
 *   --skip-packages   No actualizar paquetes npm
 *
 * Requisitos:
 *   - Tener configurado el remote 'upstream' apuntando al repo BaseForge
 *   - Estar en la rama 'develop' (o la que se quiera actualizar)
 */

import { $ } from "bun";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";

interface Args {
  dryRun: boolean;
  tag: string;
  autoConfirm: boolean;
  skipPackages: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    tag: (() => { const i = args.indexOf("--tag"); return i !== -1 ? args[i + 1] : ""; })(),
    autoConfirm: args.includes("--yes"),
    skipPackages: args.includes("--skip-packages"),
  };
}

function log(level: "info" | "warn" | "error" | "step", msg: string): void {
  const prefix = level === "info" ? `${GREEN}ℹ${RESET}` : level === "warn" ? `${YELLOW}⚠${RESET}` : level === "error" ? `${RED}✖${RESET}` : `${CYAN}▶${RESET}`;
  console.log(`  ${prefix} ${msg}`);
}

async function confirm(msg: string): Promise<boolean> {
  process.stdout.write(`\n  ${YELLOW}?${RESET} ${msg} ${BOLD}(y/N)${RESET} `);
  for await (const line of console) {
    return line.toLowerCase() === "y" || line.toLowerCase() === "yes";
  }
  return false;
}

async function runOrDry(cmd: string[], dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    log("info", `[DRY-RUN] Se ejecutaría: ${cmd.join(" ")}`);
    return true;
  }
  try {
    const result = await $`${cmd}`.quiet();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = parseArgs();

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  🚀 BaseForge — Actualización desde Plantilla`);
  console.log(`  ${args.dryRun ? "(DRY RUN — no se ejecutarán cambios)" : ""}`);
  console.log(`${"═".repeat(60)}\n`);

  // 1. Verificar entorno
  log("step", "Verificando entorno...");

  const hasGit = await $`which git`.quiet().then(() => true).catch(() => false);
  if (!hasGit) { log("error", "Git no está instalado"); process.exit(1); }

  const hasUpstream = await $`git remote get-url upstream`.quiet().then(() => true).catch(() => false);
  if (!hasUpstream) {
    log("error", "Remote 'upstream' no configurado.");
    log("info", "Configúralo con: git remote add upstream https://github.com/tu-org/baseforge.git");
    process.exit(1);
  }

  const currentBranch = (await $`git rev-parse --abbrev-ref HEAD`.text()).trim();
  log("info", `Rama actual: ${currentBranch}`);

  // 2. Buscar último tag
  log("step", "Buscando tags disponibles...");
  await $`git fetch upstream --tags`.quiet();
  const tags = (await $`git tag --list 'v*' --sort=-version:refname`.text()).trim().split("\n").filter(Boolean);

  let targetTag = args.tag;
  if (!targetTag) {
    targetTag = tags[0];
  }

  if (!targetTag) {
    log("error", "No se encontraron tags. Sin releases estables para mergear.");
    process.exit(1);
  }

  log("info", `Último tag: ${CYAN}${targetTag}${RESET}`);
  if (tags.length > 1) {
    log("info", `Tags disponibles: ${tags.slice(0, 5).join(", ")}${tags.length > 5 ? "..." : ""}`);
  }

  // 3. Confirmar
  if (!args.autoConfirm) {
    const ok = await confirm(`¿Proceder con merge de ${CYAN}${targetTag}${RESET} en rama ${CYAN}${currentBranch}${RESET}?`);
    if (!ok) { log("warn", "Operación cancelada."); process.exit(0); }
  }

  // 4. Verificar cambios sin commit
  const hasUncommitted = await $`git status --porcelain`.text().then((t) => t.trim().length > 0);
  if (hasUncommitted) {
    log("warn", "Hay cambios sin commit. Se recomienda commitearlos primero.");
    if (!args.autoConfirm) {
      const ok = await confirm("¿Continuar de todas formas?");
      if (!ok) { log("warn", "Operación cancelada."); process.exit(0); }
    }
  }

  // 5. Actualizar paquetes npm
  if (!args.skipPackages) {
    log("step", "Actualizando paquetes npm (@baseforge/*)...");
    const success = await runOrDry(
      ["bun", "update", "@baseforge/shared", "@baseforge/validation", "@baseforge/api-client"],
      args.dryRun
    );
    if (success) log("info", "Paquetes actualizados");
    else log("warn", "Algunos paquetes no se pudieron actualizar (puede que no estén publicados)");
  }

  // 6. Hacer merge del tag
  log("step", `Mergeando ${CYAN}${targetTag}${RESET}...`);
  const mergeOk = await runOrDry(
    ["git", "merge", targetTag],
    args.dryRun
  );

  if (!mergeOk && !args.dryRun) {
    log("warn", "El merge tuvo conflictos. Resolverlos manualmente y luego ejecutar:");
    log("info", "  bun install && bun run build && bun run test && bun run db:migrate");
    process.exit(1);
  }

  // 7. Post-merge
  if (!args.dryRun) {
    log("step", "Post-merge: instalando dependencias...");
    await $`bun install`.quiet();
    log("info", "Dependencias instaladas");

    log("step", "Post-merge: compilando...");
    const buildOk = await $`bun run build`.quiet().then(() => true).catch(() => false);
    if (buildOk) log("info", "Build exitoso");
    else log("warn", "Build falló — revisar errores manualmente");

    log("step", "Post-merge: ejecutando pruebas...");
    const testOk = await $`bun run test`.quiet().then(() => true).catch(() => false);
    if (testOk) log("info", "Tests pasaron");
    else log("warn", "Tests fallaron — revisar manualmente");
  }

  // 8. Resumen
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ✅ Actualización completada`);
  console.log(`  ${args.dryRun ? "(DRY RUN)" : ""}`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  • Tag mergeado:    ${targetTag}`);
  console.log(`  • Rama:            ${currentBranch}`);
  console.log(`  • Paquetes:        ${args.skipPackages ? "saltados" : "actualizados"}`);

  if (!args.dryRun) {
    console.log(``);
    console.log(`  Próximos pasos:`);
    console.log(`  1. Revisar conflictos (si los hay): git status`);
    console.log(`  2. Probar manualmente: bun run dev`);
    console.log(`  3. Hacer commit del merge: git commit`);
    console.log(`  4. Pushear: git push origin ${currentBranch}`);
  }
  console.log(`${"═".repeat(60)}\n`);
}

main();
