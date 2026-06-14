# Base de Datos — BaseForge SaaS

> **BF-3116** — Versión 1.0 — 2026-06-14

---

## Stack

| Componente | Tecnología |
|---|---|
| Motor | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Migraciones | Drizzle Kit (SQL generado) |
| Schema | `app` (schema de PostgreSQL) |

---

## Esquema

Todas las tablas están en el schema `app` de PostgreSQL.

### Tablas principales

| Tabla | Propósito |
|---|---|
| `platform_users` | Usuarios de la plataforma (global) |
| `tenants` | Inquilinos (organizaciones) |
| `tenant_users` | Membresías tenant-usuario |
| `roles` | Roles (por tenant o globales) |
| `permissions` | Catálogo de permisos (global) |
| `role_permissions` | Asignación permiso-rol |
| `user_roles` | Asignación rol-usuario |
| `menus` | Menús de navegación |
| `menu_permissions` | Permisos requeridos por menú |
| `plans` | Planes de suscripción |
| `features_catalog` | Catálogo de características |
| `plan_features` | Features incluidas en cada plan |
| `subscriptions` | Suscripciones de tenants |
| `tenant_overrides_features` | Overrides de features por tenant |
| `tenant_settings` | Configuración por tenant |
| `user_sessions` | Sesiones activas |
| `refresh_tokens` | Refresh tokens (hasheados) |
| `audit_logs` | Bitácora de auditoría |
| `notifications` | Bandeja de notificaciones |
| `files` | Archivos almacenados |

---

## Convenciones

- **IDs**: UUID v4, generados desde la aplicación (`gen_random_uuid()`)
- **Fechas**: `created_at`, `updated_at`, `deleted_at` (timestamp with timezone)
- **Eliminación lógica**: `deleted_at IS NULL` para registros activos
- **Nombres**: `snake_case`
- **Schema**: `app` para todas las tablas

---

## Conexión

```typescript
// apps/api/src/database/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

---

## Índices de rendimiento

Ver `database/migrations/002_performance_indexes.sql` para índices en:
- `platform_users.email` (login)
- `tenant_users.tenant_id + status` (membresías)
- `audit_logs.tenant_id + occurred_at` (auditoría)
- `refresh_tokens.token_hash` (unique)
- Y más...
