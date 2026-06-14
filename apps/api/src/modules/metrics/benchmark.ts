/**
 * Benchmark Script — BaseForge SaaS Fase 30
 *
 * Mide los tiempos de respuesta de los endpoints críticos contra los
 * objetivos definidos en el plan maestro.
 *
 * Uso:
 *   bun run apps/api/src/modules/metrics/benchmark.ts
 *
 * Requiere que el servidor esté corriendo en http://localhost:3000
 */

const BASE_URL = process.env.API_URL ?? "http://localhost:3000";
const API = `${BASE_URL}/api/v1`;

interface BenchmarkResult {
  endpoint: string;
  method: string;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  statusCode: number;
  target: number;
  pass: boolean;
}

async function measureRequest(
  method: string,
  url: string,
  body?: object,
  headers?: Record<string, string>
): Promise<{ ms: number; status: number }> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const ms = performance.now() - start;
    return { ms, status: res.status };
  } catch {
    return { ms: performance.now() - start, status: 0 };
  }
}

async function benchmark(
  label: string,
  method: string,
  url: string,
  targetMs: number,
  iterations = 10,
  body?: object,
  headers?: Record<string, string>
): Promise<BenchmarkResult> {
  const times: number[] = [];
  let statusCode = 0;

  // Warmup
  await measureRequest(method, url, body, headers);

  for (let i = 0; i < iterations; i++) {
    const { ms, status } = await measureRequest(method, url, body, headers);
    times.push(ms);
    statusCode = status;
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((s, v) => s + v, 0) / times.length;
  const p95 = times[Math.floor(times.length * 0.95)] ?? times[times.length - 1];

  return {
    endpoint: label,
    method,
    avgMs: Math.round(avg),
    minMs: Math.round(times[0]),
    maxMs: Math.round(times[times.length - 1]),
    p95Ms: Math.round(p95),
    statusCode,
    target: targetMs,
    pass: avg < targetMs,
  };
}

function printResults(results: BenchmarkResult[]) {
  const LINE = "─".repeat(80);
  console.log(`\n${"=".repeat(80)}`);
  console.log("  BaseForge SaaS — Benchmark de Rendimiento");
  console.log(`${"=".repeat(80)}`);
  console.log(
    `${"Endpoint".padEnd(35)} ${"Avg".padStart(6)} ${"Min".padStart(6)} ${"Max".padStart(6)} ${"P95".padStart(6)} ${"Target".padStart(8)} ${"Estado".padStart(8)}`
  );
  console.log(LINE);

  for (const r of results) {
    const status = r.pass ? "✅ PASS" : "❌ FAIL";
    const avg = `${r.avgMs}ms`;
    const min = `${r.minMs}ms`;
    const max = `${r.maxMs}ms`;
    const p95 = `${r.p95Ms}ms`;
    const target = `<${r.target}ms`;
    console.log(
      `${r.endpoint.padEnd(35)} ${avg.padStart(6)} ${min.padStart(6)} ${max.padStart(6)} ${p95.padStart(6)} ${target.padStart(8)} ${status.padStart(8)}`
    );
  }

  console.log(LINE);
  const passed = results.filter((r) => r.pass).length;
  console.log(`  ${passed}/${results.length} endpoints cumplen el objetivo de rendimiento`);
  console.log(`${"=".repeat(80)}\n`);
}

// Cabeceras de administrador para endpoints autenticados
// NOTA: Reemplazar este token con uno válido antes de ejecutar el benchmark completo
const ADMIN_HEADERS: Record<string, string> = {
  Authorization: `Bearer ${process.env.BENCHMARK_TOKEN ?? ""}`,
  "x-tenant-id": process.env.BENCHMARK_TENANT_ID ?? "",
};

async function main() {
  console.log(`\n🔍 Conectando a ${BASE_URL}...`);

  const results: BenchmarkResult[] = [];

  // 1. Health check — objetivo < 100ms
  results.push(
    await benchmark("GET /health", "GET", `${BASE_URL}/health`, 100, 20)
  );

  // 2. Ready check — objetivo < 100ms
  results.push(
    await benchmark("GET /ready", "GET", `${BASE_URL}/ready`, 100, 20)
  );

  // 3. Login — objetivo < 800ms
  results.push(
    await benchmark(
      "POST /auth/login",
      "POST",
      `${API}/auth/login`,
      800,
      5,
      { email: "superadmin@baseforge.local", password: "SuperAdmin123!" }
    )
  );

  // 4. Métricas Prometheus — objetivo < 100ms
  results.push(
    await benchmark("GET /metrics", "GET", `${BASE_URL}/metrics`, 100, 20)
  );

  // 5. Listado paginado de tenants — objetivo < 500ms
  results.push(
    await benchmark(
      "GET /superadmin/tenants?page=1&pageSize=20",
      "GET",
      `${API}/superadmin/tenants?page=1&pageSize=20`,
      500,
      10,
      undefined,
      ADMIN_HEADERS
    )
  );

  // 6. Listado paginado de usuarios — objetivo < 500ms
  results.push(
    await benchmark(
      "GET /users?page=1&pageSize=20",
      "GET",
      `${API}/users?page=1&pageSize=20`,
      500,
      10,
      undefined,
      ADMIN_HEADERS
    )
  );

  // 7. Listado paginado de roles — objetivo < 500ms
  results.push(
    await benchmark(
      "GET /roles?page=1&pageSize=20",
      "GET",
      `${API}/roles?page=1&pageSize=20`,
      500,
      10,
      undefined,
      ADMIN_HEADERS
    )
  );

  // 8. Listado paginado de planes — objetivo < 500ms
  results.push(
    await benchmark(
      "GET /superadmin/plans?page=1&pageSize=20",
      "GET",
      `${API}/superadmin/plans?page=1&pageSize=20`,
      500,
      10,
      undefined,
      ADMIN_HEADERS
    )
  );

  // 9. Listado paginado de audit logs — objetivo < 1000ms
  results.push(
    await benchmark(
      "GET /superadmin/audit-logs?page=1&pageSize=20",
      "GET",
      `${API}/superadmin/audit-logs?page=1&pageSize=20`,
      1000,
      10,
      undefined,
      ADMIN_HEADERS
    )
  );

  // 10. Settings del tenant — objetivo < 500ms
  results.push(
    await benchmark(
      "GET /settings (tenant)",
      "GET",
      `${API}/settings`,
      500,
      10,
      undefined,
      ADMIN_HEADERS
    )
  );

  // 11. Menús del tenant — objetivo < 500ms
  results.push(
    await benchmark(
      "GET /menus",
      "GET",
      `${API}/menus`,
      500,
      10,
      undefined,
      ADMIN_HEADERS
    )
  );

  // 12. Notificaciones — objetivo < 500ms
  results.push(
    await benchmark(
      "GET /notifications",
      "GET",
      `${API}/notifications`,
      500,
      10,
      undefined,
      ADMIN_HEADERS
    )
  );

  printResults(results);

  // Exit con código de error si algún test falla
  const anyFailed = results.some((r) => !r.pass);
  process.exit(anyFailed ? 1 : 0);
}

main();
