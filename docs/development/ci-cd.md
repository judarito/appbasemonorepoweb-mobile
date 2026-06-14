# CI/CD — BaseForge SaaS

> **BF-3120** — Versión 1.0 — 2026-06-14

---

## Proveedor

GitHub Actions — configuración en `infrastructure/github-actions/`.

---

## CI (Continuous Integration)

Se ejecuta en cada push a `develop` y en cada PR hacia `main`.

```yaml
# Flujo de CI
jobs:
  lint:
    - bun run lint
  typecheck:
    - bun run typecheck
  test:
    - bun run test
  build:
    - bun run build
  security:
    - bun audit
    - secret scanning
```

### Gateways de calidad

| Verificación | Requisito |
|---|---|
| Lint | 0 errores, 0 warnings |
| TypeScript | Compilación sin errores |
| Tests | Todos verdes |
| Build | Compila web, API y mobile |
| Seguridad | Sin vulnerabilidades críticas |

---

## CD (Continuous Deployment)

### Development

Despliegue automático al hacer merge en `develop`:

1. Build de API y web
2. Ejecutar migraciones
3. Desplegar API
4. Desplegar web
5. Smoke tests

### Staging

Despliegue manual desde `develop`:

1. Crear tag `vX.Y.Z-rc.N`
2. Desplegar en ambiente de staging
3. Ejecutar tests de integración
4. Notificar al equipo

### Production

Despliegue con aprobación manual:

1. Backup de base de datos
2. Ejecutar migraciones
3. Desplegar API (rolling update)
4. Desplegar web (sin downtime)
5. Smoke tests
6. Crear release + tag
7. Notificar

---

## Estrategia de rollback

```bash
# Rollback de API
git revert HEAD~1
bun run build --filter=@baseforge/api
# Redeploy versión anterior

# Rollback de migración
bun run db:rollback
```
