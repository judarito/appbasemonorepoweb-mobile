# Changelog — BaseForge SaaS

> **BF-3124** — Versión 1.0 — 2026-06-14

---

## [0.2.0] — 2026-06-14

### Fase 30 — Rendimiento
- Implementado: lazy loading con React.lazy() y code splitting por ruta
- Benchmarks extendidos con endpoints paginados
- Script EXPLAIN ANALYZE para diagnóstico de consultas
- Script de medición de rendimiento web
- Revisión de patrones N+1 documentada

### Fase 31 — Documentación
- 25 documentos técnicos creados (instalación, desarrollo, arquitectura, seguridad, API, DB, despliegue, etc.)

---

## [1.0.0] — 2026-06-14

### Fase 34 — Release 1.0
- ✅ Validación completa de todas las funcionalidades (57/57 tareas auditadas)
- ✅ 50 tests pasando, 0 fallos
- ✅ Documentación completa (25 documentos)
- ✅ Bug fix: cache invalidation en feature flags tests
- ✅ Release checklist creada: `docs/release-v1.0.0.md`

### Fase 33 — Estrategia para actualizar forks
- ✅ Modelo híbrido plantilla + paquetes
- ✅ Paquetes versionados (shared, validation, api-client → v0.1.0)
- ✅ Changelogs por paquete
- ✅ `scripts/update-from-template.ts` — actualización automática

### Fase 32 — Sistema para crear forks
- ✅ `scripts/create-app.ts` — generador de forks CLI
- ✅ Reemplazo automático de nombres en 70+ archivos
- ✅ Schema TS + migración SQL para nuevo dominio

### Fase 31 — Documentación
- ✅ 25 documentos técnicos creados

### Fase 30 — Rendimiento
- ✅ Lazy loading con React.lazy() y code splitting
- ✅ Benchmarks con endpoints paginados
- ✅ EXPLAIN ANALYZE para diagnóstico SQL
- ✅ Revisión de patrones N+1

---

## [0.1.0] — 2026-06-13

### Fases 15-29
- Implementación completa de web app con layout superadmin y tenant
- SettingsView con pestañas y selector de tenant
- Sistema de archivos con subida/descarga
- Fix: parpadeo de skeleton en AppListView
- Fix: formato de permisos (dot notation)
- Fix: paginación en vistas de tenant
- Sidebar responsivo con toggle
- Conversión responsiva de AppListView a cards

---

## [0.0.1] — 2026-06-13

### Fases 0-14
- Setup inicial del monorepo (Bun + Turborepo)
- Base de datos PostgreSQL con Drizzle ORM
- API con Hono (auth, users, roles, menús, settings, etc.)
- Web app con React + Vite
- Mobile app con Expo
- Autenticación JWT con refresh tokens rotativos
- Sistema de roles y permisos
- Menús dinámicos
- Configuración por tenant
- Feature flags y planes de suscripción
- Auditoría y observabilidad
- Caché LRU en memoria
- Índices de rendimiento en BD

---

## Formato

El changelog sigue [Keep a Changelog](https://keepachangelog.com/) y el proyecto usa [Semantic Versioning](https://semver.org/).
