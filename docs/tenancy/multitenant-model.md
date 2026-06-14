# Modelo Multitenant — BaseForge SaaS

> **BF-3106** — Versión 1.0 — 2026-06-14

---

## Estrategia

BaseForge usa **una base de datos compartida** con **aislamiento por columna `tenant_id`**.

```
PostgreSQL
└── Schema: app
    ├── tenants           ← Raíz del modelo
    ├── platform_users    ← Usuarios globales
    ├── tenant_users      ← Membresías tenant-usuario
    ├── roles             ← Roles por tenant
    ├── user_roles        ← Asignación de roles
    └── ...               ← Demás tablas con tenant_id
```

---

## Resolución del tenant

Cada request HTTP resuelve el tenant activo mediante:

1. **Header `x-tenant-id`**: ID directo del tenant (usado por superadmin/soporte)
2. **Header `x-tenant-code`**: Código del tenant (usado desde web frontend)
3. **Subdominio**: En futura versión, se resolverá desde `{tenant}.baseforge.app`

```typescript
// Pseudocódigo de resolución
function resolveTenant(c) {
  const tenantId = c.req.header("x-tenant-id");
  const tenantCode = c.req.header("x-tenant-code");
  // ... resolver y validar
}
```

---

## Tablas multitenant

| Tabla | `tenant_id` | Tipo de aislamiento |
|---|---|---|
| `tenant_users` | ✅ Propia | Membresía |
| `roles` | ✅ (nullable para globales) | Por tenant |
| `menus` | ✅ | Por tenant |
| `tenant_settings` | ✅ | Por tenant |
| `audit_logs` | ✅ | Por tenant |
| `notifications` | ✅ | Por tenant |
| `files` | ✅ | Por tenant |
| `platform_users` | ❌ | Global (tabla compartida) |
| `permissions` | ❌ | Global (catálogo) |
| `plans` | ❌ | Global (catálogo) |
| `features_catalog` | ❌ | Global (catálogo) |

---

## Seguridad del modelo

### Validación en cada request

El middleware de tenant valida que el usuario autenticado tenga membresía activa en el tenant solicitado:

```typescript
const membership = await db.query.tenantUsers.findFirst({
  where: and(
    eq(tenantUsers.tenantId, tenantId),
    eq(tenantUsers.userId, userId),
    eq(tenantUsers.status, "ACTIVE"),
    isNull(tenantUsers.deletedAt),
  ),
});
```

### Row Level Security (PostgreSQL)

Como defensa adicional, se puede habilitar RLS en tablas críticas:

```sql
ALTER TABLE app.tenant_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON app.tenant_users
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## Superadmin

El rol `SUPER_ADMIN` tiene acceso global y puede:

- Ver todos los tenants
- Modificar configuraciones de cualquier tenant (modo soporte)
- Crear/modificar planes y catálogos globales
- Ver logs de auditoría de todos los tenants

El superadmin **no pertenece** a ningún tenant. Su membresía se verifica por rol, no por `tenant_users`.
