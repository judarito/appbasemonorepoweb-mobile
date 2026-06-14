# SDK — BaseForge SaaS

> **BF-3115** — Versión 1.0 — 2026-06-14

---

## Paquetes compartidos

El monorepo incluye los siguientes paquetes en `packages/`:

| Paquete | Descripción |
|---|---|
| `@baseforge/shared` | Tipos, interfaces y utilidades compartidas |
| `@baseforge/validation` | Schemas Zod para validación |
| `@baseforge/api-client` | Cliente HTTP tipado para la API |
| `@baseforge/auth` | Lógica de autenticación compartida |
| `@baseforge/ui-web` | Componentes UI reutilizables (web) |
| `@baseforge/ui-mobile` | Componentes UI reutilizables (mobile) |
| `@baseforge/config` | Configuración compartida |
| `@baseforge/tsconfig` | Base de TypeScript config |
| `@baseforge/eslint-config` | Configuración de ESLint |

---

## API Client

```typescript
import { ApiClient } from "@baseforge/api-client";

const api = new ApiClient({
  baseUrl: "http://localhost:3000/api/v1",
  getToken: () => useAuthStore.getState().token,
});

// Tipado automático
const users = await api.get<User[]>("/users", {
  params: { page: 1, pageSize: 20 },
});

const newUser = await api.post<User>("/users", {
  email: "user@example.com",
  password: "secure123",
});
```

---

## Validation (Zod)

```typescript
import { z } from "@baseforge/validation";

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

Los schemas se comparten entre API y frontend para validación consistente.

---

## Shared types

```typescript
import type { PaginatedResponse, ApiError, User, Role, Tenant, MenuItem } from "@baseforge/shared";
```

---

## Consumo desde los frontends

**Web:**
```typescript
import { api } from "@/lib/api";
const data = await api.get("/users");
```

**Mobile:**
```typescript
import { api } from "@baseforge/api-client";
const data = await api.get("/users");
```
