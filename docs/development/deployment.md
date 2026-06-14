# Despliegue — BaseForge SaaS

> **BF-3121** — Versión 1.0 — 2026-06-14

---

## Ambientes

| Ambiente | Propósito | URL ejemplo |
|---|---|---|
| Local | Desarrollo | `http://localhost:3000` |
| Development | Integración | `https://dev.baseforge.app` |
| Staging | Pre-producción | `https://staging.baseforge.app` |
| Production | Producción | `https://app.baseforge.app` |

---

## API (Bun + Hono)

### Requisitos de infraestructura

| Recurso | Mínimo | Recomendado |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 512 MB | 1 GB |
| Disco | 1 GB | 5 GB |

### Despliegue

```bash
# Build
bun run build --filter=@baseforge/api

# Iniciar
cd apps/api
NODE_ENV=production bun run dist/main.js
```

### Variables de entorno requeridas

Ver [Guía de variables de entorno](./environment-variables.md).

---

## Web (React + Vite)

### Build

```bash
bun run build --filter=@baseforge/web
# Genera: apps/web/dist/
```

Los archivos estáticos se sirven desde CDN o servidor web (Nginx, Caddy, Cloudflare Pages).

### Recomendaciones

- Usar CDN para assets estáticos
- Cacheo agresivo de vendors (long-term caching)
- Compresión Brotli/Gzip
- HTTP/2 o HTTP/3

---

## Mobile (React Native + Expo)

```bash
# Build para desarrollo
cd apps/mobile
eas build --profile development

# Build para producción
eas build --profile production

# Publicar en stores
eas submit
```

---

## Base de datos (PostgreSQL)

### Proveedores recomendados

| Proveedor | Ideal para |
|---|---|
| Neon | Serverless, escalable |
| Supabase | Proyectos pequeños/medianos |
| AWS RDS | Producción empresarial |
| Render PostgreSQL | Middle ground |

### Backup

```bash
# Backup manual
pg_dump -U baseforge baseforge > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U baseforge baseforge < backup.sql
```
