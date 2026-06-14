/**
 * Web Performance Measurement — BaseForge SaaS Fase 30
 *
 * Mide tiempos de carga de la aplicación web usando Puppeteer/Playwright.
 *
 * Uso:
 *   bun run apps/web/src/test/web-performance.ts
 *
 * Requisitos:
 *   - Servidor web corriendo (bun run dev en apps/web)
 *   - Servidor API corriendo (bun run dev en apps/api)
 *   - Playwright instalado (bun add -D @playwright/test)
 */

const BASE_URL = process.env.WEB_URL ?? "http://localhost:5173";
const API_URL = process.env.API_URL ?? "http://localhost:3000";

interface PerfResult {
  page: string;
  label: string;
  fcpMs: number;     // First Contentful Paint
  lcpMs: number;     // Largest Contentful Paint
  domInteractiveMs: number;
  loadMs: number;
  jsBundleBytes: number;
  cssBundleBytes: number;
  requests: number;
  pass: boolean;
}

async function measurePage(
  label: string,
  url: string
): Promise<PerfResult> {
  console.log(`  📄 Midiendo ${label}...`);

  // Usamos fetch + performance.now() como medición básica
  // Para mediciones completas (FCP, LCP), usar Playwright/Lighthouse
  const start = performance.now();

  try {
    const response = await fetch(url);
    const text = await response.text();
    const loadMs = performance.now() - start;

    // Estimar tamaño del bundle HTML
    const htmlBytes = new Blob([text]).size;

    return {
      page: url,
      label,
      fcpMs: loadMs, // aproximación: para medición exacta usar Playwright
      lcpMs: loadMs,
      domInteractiveMs: loadMs,
      loadMs: Math.round(loadMs),
      jsBundleBytes: 0, // requiere análisis de assets
      cssBundleBytes: 0,
      requests: 1,
      pass: loadMs < 3000, // objetivo: < 3s en conexión media
    };
  } catch (error: any) {
    console.error(`  ❌ Error al medir ${label}: ${error.message}`);
    return {
      page: url,
      label,
      fcpMs: -1,
      lcpMs: -1,
      domInteractiveMs: -1,
      loadMs: -1,
      jsBundleBytes: 0,
      cssBundleBytes: 0,
      requests: 0,
      pass: false,
    };
  }
}

async function analyzeBundleSizes(): Promise<{
  jsBytes: number;
  cssBytes: number;
  totalBytes: number;
}> {
  // Analizar los archivos en dist/assets/
  const fs = await import("fs");
  const path = await import("path");
  const distDir = path.resolve(__dirname, "../../dist/assets");

  let jsBytes = 0;
  let cssBytes = 0;

  if (!fs.existsSync(distDir)) {
    console.log("  ⚠ No se encontró dist/assets/ — ejecuta 'bun run build' primero");
    return { jsBytes: 0, cssBytes: 0, totalBytes: 0 };
  }

  const files = fs.readdirSync(distDir);
  for (const file of files) {
    const filePath = path.join(distDir, file);
    const stat = fs.statSync(filePath);
    if (file.endsWith(".js")) jsBytes += stat.size;
    if (file.endsWith(".css")) cssBytes += stat.size;
  }

  return {
    jsBytes,
    cssBytes,
    totalBytes: jsBytes + cssBytes,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

async function main() {
  console.log(`\n${"=".repeat(70)}`);
  console.log("  BaseForge SaaS — Medición de Rendimiento Web");
  console.log(`  Web: ${BASE_URL}  |  API: ${API_URL}`);
  console.log(`${"=".repeat(70)}\n`);

  // 1. Medir páginas principales
  console.log("📊 Midiendo páginas...");
  const pages = [
    { label: "Home (inicio)", url: BASE_URL },
    { label: "Login", url: `${BASE_URL}/login` },
  ];

  const results: PerfResult[] = [];
  for (const page of pages) {
    const result = await measurePage(page.label, page.url);
    results.push(result);
  }

  // 2. Analizar bundles
  console.log("\n📦 Analizando bundles...");
  const bundles = await analyzeBundleSizes();
  if (bundles.totalBytes > 0) {
    console.log(`  • JS total: ${formatBytes(bundles.jsBytes)}`);
    console.log(`  • CSS total: ${formatBytes(bundles.cssBytes)}`);
    console.log(`  • Total: ${formatBytes(bundles.totalBytes)}`);
  }

  // 3. Mostrar resultados
  console.log(`\n${"─".repeat(70)}`);
  console.log(
    `${"Página".padEnd(25)} ${"Carga".padEnd(8)} ${"Objetivo".padEnd(10)} ${"Estado".padEnd(8)}`
  );
  console.log(`${"─".repeat(70)}`);

  for (const r of results) {
    const status = r.pass ? "✅ PASS" : r.loadMs < 0 ? "⚠ ERROR" : "❌ FAIL";
    const load = r.loadMs >= 0 ? `${r.loadMs}ms` : "N/A";
    console.log(
      `${r.label.padEnd(25)} ${load.padEnd(8)} ${"< 3000ms".padEnd(10)} ${status.padEnd(8)}`
    );
  }

  // 4. Verificar lazy loading (múltiples chunks JS)
  if (bundles.jsBytes > 0) {
    console.log(`\n${"─".repeat(70)}`);
    const fs = await import("fs");
    const path = await import("path");
    const distDir = path.resolve(__dirname, "../../dist/assets");
    const jsFiles = fs.readdirSync(distDir).filter((f: string) => f.endsWith(".js"));
    console.log(`  📦 Chunks JS generados: ${jsFiles.length}`);
    jsFiles.forEach((f: string) => {
      const stat = fs.statSync(path.join(distDir, f));
      console.log(`     • ${f.padEnd(40)} ${formatBytes(stat.size)}`);
    });

    const hasVendorChunks = jsFiles.some((f: string) => f.includes("vendor"));
    console.log(`  ${hasVendorChunks ? "✅" : "⚠"} Separación de vendors: ${hasVendorChunks ? "Sí" : "No — revisar vite.config.ts"}`);

    const hasLazyChunks = jsFiles.length > 3;
    console.log(`  ${hasLazyChunks ? "✅" : "⚠"} Code splitting por rutas: ${hasLazyChunks ? `Sí (${jsFiles.length} chunks)` : "No — implementar React.lazy()"}`);
  }

  // 5. Resumen de objetivos
  console.log(`\n${"=".repeat(70)}`);
  console.log("  OBJETIVOS DE RENDIMIENTO WEB");
  console.log(`${"=".repeat(70)}`);
  console.log(`  • Carga inicial:   ${results[0]?.pass ? "✅" : "❌"} ${results[0]?.loadMs ?? "N/A"}ms  (objetivo: < 3000ms)`);
  console.log(`  • Login:           ${results[1]?.pass ? "✅" : "❌"} ${results[1]?.loadMs ?? "N/A"}ms  (objetivo: < 3000ms)`);
  console.log(`  • Bundle total:    ${bundles.totalBytes > 0 ? formatBytes(bundles.totalBytes) : "N/A"}  (recomendado: < 500KB)`);
  console.log(`  • Chunks JS:       ${bundles.totalBytes > 0 ? `${(await getJsFileCount())} archivos` : "N/A"}`);
  console.log(`\n  NOTA: Para medición precisa de FCP/LCP, usar Lighthouse en Chrome DevTools`);
  console.log(`${"=".repeat(70)}\n`);

  const anyFailed = results.some((r) => !r.pass);
  process.exit(anyFailed ? 1 : 0);
}

async function getJsFileCount(): Promise<number> {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = path.resolve(__dirname, "../../dist/assets");
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter((f: string) => f.endsWith(".js")).length;
  } catch {
    return 0;
  }
}

main();
