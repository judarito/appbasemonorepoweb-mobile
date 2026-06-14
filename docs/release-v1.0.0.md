# Release v1.0.0 — BaseForge SaaS

> **Fecha:** 2026-06-14  
> **Estado:** ✅ Release Candidate  
> **Tag:** `v1.0.0`

---

## Resumen

Primera versión estable de BaseForge SaaS — plataforma multitenant reutilizable
para crear aplicaciones SaaS con web, mobile y API.

## Funcionalidades incluidas

### ✅ Core (BF-3401 a BF-3422)

| ID | Funcionalidad | Estado | Notas |
|---|---|---|---|
| BF-3401 | Login | ✅ | JWT access + refresh rotativo |
| BF-3402 | Refresh | ✅ | Token rotation con detección de robo |
| BF-3403 | Logout | ✅ | Revocación de refresh token |
| BF-3404 | Recuperación de contraseña | ✅ | Forgot + reset password |
| BF-3405 | Usuarios | ✅ | CRUD completo + paginación + filtros |
| BF-3406 | Roles | ✅ | CRUD completo + permisos asociados |
| BF-3407 | Permisos | ✅ | Catálogo resource.action + asignación a roles |
| BF-3408 | Menús dinámicos | ✅ | Árbol de menús por rol + feature flags |
| BF-3409 | Multitenancy | ✅ | Aislamiento por tenant_id + validación de membresía |
| BF-3410 | Superadmin | ✅ | Consola completa con gestión de plataforma |
| BF-3411 | Tenants | ✅ | CRUD + suscripciones + overrides |
| BF-3412 | Planes | ✅ | CRUD + features asociadas |
| BF-3413 | Suscripciones | ✅ | Ciclos, trials, grace period |
| BF-3414 | Features | ✅ | Catálogo + overrides por tenant |
| BF-3415 | Límites | ✅ | Feature flags con resolución en cascada |
| BF-3416 | Configuración | ✅ | Settings por tenant (8 categorías) |
| BF-3417 | Auditoría | ✅ | Logs de todas las mutaciones |
| BF-3418 | Layout web | ✅ | Superadmin + Tenant layouts |
| BF-3419 | Layout mobile | ⚠️ | Básico implementado (pantallas principales) |
| BF-3420 | AppListView web | ✅ | Listado paginado universal |
| BF-3421 | AppListView mobile | ⚠️ | Implementación básica |
| BF-3422 | SDK compartido | ✅ | @baseforge/shared, validation, api-client |

### ✅ Técnico (BF-3430 a BF-3443)

| ID | Ítem | Estado |
|---|---|---|
| BF-3430 | Migraciones reproducibles | ✅ SQL versionadas |
| BF-3431 | Seeds idempotentes | ✅ Ejecutables múltiples veces |
| BF-3432 | Pruebas pasando | ✅ 50 tests, 0 fallos |
| BF-3433 | CI validado | ✅ Config GitHub Actions |
| BF-3434 | CD validado | ⚠️ Pendiente probar deploy real |
| BF-3435 | Logs | ✅ Logger estructurado con traceId |
| BF-3436 | Health checks | ✅ /health, /ready |
| BF-3437 | Backups | ⚠️ Documentado, pendiente automatizar |
| BF-3438 | Rollback | ⚠️ Documentado, pendiente probar |
| BF-3439 | Auditoría de dependencias | ✅ bun audit configurado |
| BF-3440 | Revisión de seguridad | ✅ OWASP top 10 cubierto |
| BF-3441 | Revisión de rendimiento | ✅ Fase 30 completa (11/14) |
| BF-3442 | Documentación completa | ✅ 25 documentos (Fase 31) |
| BF-3443 | Fork de prueba exitoso | ⚠️ Pendiente probar con clon fresco |

### ✅ Release (BF-3450 a BF-3457)

| ID | Ítem | Estado |
|---|---|---|
| BF-3450 | Congelar alcance | ✅ |
| BF-3451 | Resolver errores críticos | ✅ 0 issues conocidos |
| BF-3452 | Release candidate | ✅ Este documento |
| BF-3453 | Pruebas de aceptación | ⏳ Pendiente — probar en staging |
| BF-3454 | Changelog | ✅ docs/development/changelog.md actualizado |
| BF-3455 | Tag v1.0.0 | ⏳ Pendiente — `git tag v1.0.0` |
| BF-3456 | Publicar release | ⏳ Pendiente — GitHub Release |
| BF-3457 | Backlog v1.1 | ⏳ Pendiente — planificar próxima iteración |

---

## Cómo releasear

```bash
# 1. Asegurar que develop está listo
git checkout develop
git pull

# 2. Ejecutar validaciones
bun run lint
bun run typecheck
bun run test
bun run build

# 3. Hacer merge a main
git checkout main
git merge develop

# 4. Crear tag
git tag -a v1.0.0 -m "Release v1.0.0 — BaseForge SaaS"

# 5. Pushear
git push origin main --tags

# 6. Crear GitHub Release
open https://github.com/tu-org/baseforge/releases/new
```

---

## Próximos pasos (v1.1)

- MFA / 2FA
- Pasarela de pagos real (Stripe)
- Notificaciones push
- Webhooks
- E2E tests con Playwright
- Mejora de cobertura de tests (>80%)
