# Solución de Problemas — BaseForge SaaS

> **BF-3122** — Versión 1.0 — 2026-06-14

---

## API

### La API no inicia

```bash
# 1. Verificar variables de entorno
cat .env | grep DATABASE_URL

# 2. Verificar PostgreSQL
docker ps | grep postgres

# 3. Verificar logs
bun run dev --filter=@baseforge/api
```

### Error de conexión a BD

```bash
# 1. Probar conexión directa
psql -U baseforge -d baseforge -h localhost

# 2. Verificar que Docker esté corriendo
docker compose ps

# 3. Resetear BD
bun run db:reset
```

### 401 Unauthorized en requests

1. El token expiró → hacer login nuevamente
2. Token inválido → verificar `JWT_ACCESS_SECRET`
3. Token version desactualizado → el usuario cambió su contraseña

### 403 Forbidden

1. El usuario no tiene el permiso requerido
2. Verificar roles del usuario en DB
3. Verificar que el permiso esté asignado al rol

---

## Web

### El frontend no carga

```bash
# 1. Verificar que la API responda
curl http://localhost:3000/health

# 2. Verificar CORS
# Revisar apps/api/src/main.ts - cors()
```

### Error de compilación

```bash
# Limpiar caché de Vite
rm -rf apps/web/node_modules/.vite
bun run dev --filter=@baseforge/web
```

---

## Mobile

### Expo no conecta

1. Misma red WiFi que el servidor
2. Verificar `API_URL` en `app.json`
3. Android: usar `10.0.2.2` en lugar de `localhost`

---

## Base de datos

### Migraciones fallan

```bash
# Ver última migración aplicada
SELECT * FROM app.drizzle_migrations ORDER BY id DESC LIMIT 1;

# Reintentar
bun run db:migrate

# Reset completo (pérdida de datos)
bun run db:reset
```

### Consultas lentas

1. Ejecutar `database/scripts/explain-analyze.sql`
2. Verificar índices con `\di app.*`
3. Ejecutar `ANALYZE;` para actualizar estadísticas
