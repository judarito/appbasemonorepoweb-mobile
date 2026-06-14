# Seeds — BaseForge SaaS

> **BF-3118** — Versión 1.0 — 2026-06-14

---

## Propósito

Los seeds crean los datos mínimos necesarios para que la aplicación funcione después de una instalación limpia.

---

## Seed actual

`database/seeds/002_baseforge_seed_data.sql` contiene:

### Superadmin
| Campo | Valor |
|---|---|
| Email | `superadmin@baseforge.local` |
| Password | `SuperAdmin123!` |
| Rol | `SUPER_ADMIN` |

### Tenants de demostración
- `baseforge` — Demo tenant para pruebas

### Roles del sistema
- `TENANT_ADMIN` — Administrador del tenant
- `MANAGER` — Gestor operativo
- `VIEWER` — Solo lectura

### Permisos base
- `users.read`, `users.create`, `users.update`, `users.delete`
- `roles.read`, `roles.create`, `roles.update`, `roles.delete`
- `settings.read`, `settings.update`
- `tenants.read` (superadmin)
- `audit.read` (superadmin)

### Planes
- `FREE` — Plan gratuito (básico)
- `STARTER` — Plan inicial
- `PRO` — Plan profesional
- `ENTERPRISE` — Plan empresarial

### Features
- `MAX_USERS`, `STORAGE_GB`, `AUDIT_LOG`, `API_ACCESS`, etc.

---

## Cómo ejecutar

```bash
# Después de migrar
bun run db:seed

# Reset completo (drop + migrate + seed)
bun run db:reset
```

---

## Crear un nuevo seed

1. Crear archivo en `database/seeds/` con prefijo numérico
2. Agregar la referencia en `database/scripts/initialize-db.ts`
3. Probar con `bun run db:seed`
