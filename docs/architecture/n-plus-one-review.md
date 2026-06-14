# Revisión de Consultas N+1 — Fase 30

> Fecha: 2026-06-14  
> Objetivo: Identificar y documentar posibles problemas N+1 en la API

## ¿Qué es N+1?

Ocurre cuando se hace una consulta para obtener una lista de N registros y luego,
para cada registro, se ejecuta una consulta adicional. Ejemplo:

```typescript
// ❌ N+1: 1 consulta para los usuarios + N consultas para sus roles
const users = await db.select().from(tenantUsers);
for (const user of users) {
  const roles = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));
}
```

## Patrones identificados en BaseForge

### 1. ⚠️ Resolución de permisos por usuario

**Archivo:** `apps/api/src/middlewares/auth.ts` / módulos de roles

**Problema potencial:** Al verificar permisos en cada request, si se itera sobre
una lista de permisos y se consulta la DB por cada uno.

**Solución:** Usar JOINs con una sola consulta:
```typescript
const permissions = await db
  .select({ code: permissions.code })
  .from(userRoles)
  .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
  .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
  .where(and(
    eq(userRoles.userId, userId),
    eq(userRoles.tenantId, tenantId),
    eq(userRoles.revokedAt, null)
  ));
```

### 2. ⚠️ Menús por rol

**Archivo:** `apps/api/src/modules/menus/`

**Problema potencial:** Si se cargan menús y luego se verifican permisos
individualmente para cada ítem del menú.

**Solución:** La consulta en `explain-analyze.sql` (#8) ya usa LEFT JOIN
con DISTINCT para evitar N+1. Verificar que el código use esta misma estrategia.

### 3. ✅ Feature flags por tenant

**Archivo:** `apps/api/src/modules/features/`

**Estado:** La caché LRU (`cache.service.ts`) evita N+1 al cachear
todos los feature flags del tenant en una sola consulta.

### 4. ⚠️ Settings del tenant

**Archivo:** `apps/api/src/modules/settings/`

**Problema potencial:** Si se accede a cada setting individualmente.

**Solución:** El endpoint `GET /settings` ya retorna todas las settings
del tenant en una sola consulta. La caché LRU evita consultas repetitivas.

### 5. ✅ Auditoría

**Archivo:** `apps/api/src/modules/superadmin/audit/`

**Estado:** Los logs se obtienen con paginación y una sola consulta.
No hay riesgo N+1 porque no se hacen subconsultas por registro.

### 6. ⚠️ Notificaciones

**Archivo:** `apps/api/src/modules/notifications/`

**Problema potencial:** Si se envían notificaciones de a una por vez en un loop.

**Solución:** Usar INSERT en lote (batch insert) para notificaciones masivas
y una sola SELECT para leer la bandeja del usuario.

## Recomendaciones generales

1. **Usar `Promise.all` con consultas independientes** — No secuenciales.
2. **JOIN en lugar de subconsultas** — Preferir una consulta con JOIN sobre
   N consultas individuales.
3. **Caché LRU** — Ya implementada para features, menús y settings.
   Extender a roles/permisos si se detecta carga repetitiva.
4. **Eager loading con Drizzle** — Usar `with` de Drizzle ORM para
   relaciones cuando sea necesario.
5. **Monitoreo** — Revisar logs de consultas lentas periódicamente.

## Cómo detectar N+1 en desarrollo

```bash
# Activar logging de queries en Drizzle
# Agregar a database/db.ts:
// { logger: true } en la configuración de drizzle()
```

O desde PostgreSQL:
```sql
SELECT * FROM pg_stat_activity WHERE query NOT LIKE '%pg_stat%';
```

Si se ven muchas consultas similares ejecutándose en ráfaga, es N+1.
