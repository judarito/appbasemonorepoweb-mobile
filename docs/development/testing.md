# Pruebas — BaseForge SaaS

> **BF-3119** — Versión 1.0 — 2026-06-14

---

## Stack de pruebas

| Capa | Herramienta |
|---|---|
| API unitarias/integración | `bun:test` |
| Web unitarias | Vitest + Testing Library |
| Mobile unitarias | Jest + React Native Testing Library |
| Web E2E | Playwright |
| Mobile E2E | Maestro (futuro) |

---

## Comandos

```bash
# Todas las pruebas
bun run test

# Solo API
bun run test --filter=@baseforge/api

# Solo web
bun run test --filter=@baseforge/web

# Modo watch
bun run test --watch

# Con coverage
bun run test --coverage
```

---

## Estructura de tests

```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.service.test.ts    ← Test unitario
│   │   └── auth.integration.test.ts ← Test de integración
```

```
apps/web/src/
├── __tests__/
│   ├── components/
│   │   └── AppListView.test.tsx
│   └── views/
│       └── LoginView.test.tsx
```

---

## Pruebas de API

```typescript
import { describe, test, expect } from "bun:test";
import { app } from "../main";

describe("GET /health", () => {
  test("responde con status UP", async () => {
    const res = await app.request("/health");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.status).toBe("UP");
  });
});
```

---

## Pruebas de componentes web

```typescript
import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";

describe("StatusBadge", () => {
  test("muestra el texto correcto", () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText("ACTIVE")).toBeDefined();
  });
});
```

---

## Cobertura objetivo

| Capa | Cobertura mínima |
|---|---|
| API services | 80% |
| API controllers | 70% |
| Web components | 70% |
| Web views | 60% |
| Mobile | 60% |
