# BaseForge SaaS
## Plan maestro de ejecución — Web, Mobile, API y PostgreSQL

> Documento vivo para construir una base SaaS multitenant reutilizable mediante forks.
>
> **Estado del proyecto:** Planeación  
> **Versión del documento:** 1.0  
> **Última actualización:** 13 de junio de 2026  
> **Responsable inicial:** Juan Ricardo  

---

# 1. Cómo usar este documento

Este archivo funcionará como:

- Backlog técnico.
- Lista de comprobación.
- Registro de decisiones.
- Guía de instalación.
- Guía de arquitectura.
- Criterio de aceptación.
- Registro de avances.
- Base para crear futuros forks.

## 1.1 Estados de las tareas

Usar las siguientes marcas:

```md
[ ] Pendiente
[x] Terminado
[-] En progreso
[!] Bloqueado
[~] Pospuesto
```

Ejemplo:

```md
- [x] BF-001 Crear repositorio.
- [-] BF-002 Configurar monorepo.
- [ ] BF-003 Crear aplicación web.
- [!] BF-004 Configurar CI: falta acceso al repositorio.
```

## 1.2 Regla para marcar una tarea como terminada

Una tarea solo puede marcarse con `[x]` cuando:

1. El código esté implementado.
2. Existan pruebas cuando corresponda.
3. Las pruebas estén pasando.
4. La funcionalidad haya sido revisada manualmente.
5. La documentación esté actualizada.
6. No existan errores conocidos de severidad alta.
7. Se haya cumplido su criterio de aceptación.

## 1.3 Registro de avance

Al terminar cada sesión de trabajo, actualizar esta tabla:

| Fecha | Responsable | Tareas terminadas | Tareas en progreso | Bloqueos | Próximo paso |
|---|---|---|---|---|---|
| 2026-06-13 | Juan Ricardo | Fases 0-17 completas, Fase 18 completa (26/28 componentes) | Ninguna | Ninguno | Avanzar a Fase 19 (Layout mobile) |
| 2026-06-13 | Juan Ricardo | + Tenant Layout (/app/*) con sidebar, topbar, breadcrumb | Ninguna | Ninguno | — |
| 2026-06-13 | Juan Ricardo | + TenantDashboardView con stats de usuarios/roles | Ninguna | Ninguno | — |
| 2026-06-13 | Juan Ricardo | + TenantUsersView (listado + crear usuario) | Ninguna | Ninguno | — |
| 2026-06-13 | Juan Ricardo | + TenantRolesView (listado + crear rol) | Ninguna | Ninguno | — |
| 2026-06-13 | Juan Ricardo | + SettingsView: selector de tenant para superadmin | Ninguna | Ninguno | — |
| 2026-06-13 | Juan Ricardo | + LoginView: redirección tenant admin → /app/dashboard | Ninguna | Ninguno | — |
| 2026-06-13 | Juan Ricardo | + Fix: AppListView skeleton flicker eliminado (delay + datos persistentes) | Ninguna | Ninguno | — |
| 2026-06-13 | Juan Ricardo | + Fix: settings.controller permisos (TENANT_ADMIN + dot notation) | Ninguna | Ninguno | — |
| 2026-06-13 | Juan Ricardo | + Fix: Home navbar con estado de sesión y banner para no-superadmins | Ninguna | Ninguno | — |
| 2026-06-13 | Juan Ricardo | + Fix: fetch paginado con meta.pagination.totalItems | Ninguna | Ninguno | — |
| 2026-06-13 | Antigravity  | + Sidebar responsivo con toggle, backdrop overlay y auto-cierre al navegar | Ninguna | Ninguno | — |
| 2026-06-13 | Antigravity  | + Conversión responsiva de AppListView a listado tipo tarjetas (cards) key-value | Ninguna | Ninguno | — |
| 2026-06-13 | Antigravity  | + Restricción exclusiva de edición y eliminación para el rol TENANT_ADMIN | Ninguna | Ninguno | — |
| 2026-06-13 | Antigravity  | + Habilitación de edición y botón de eliminar para el resto de roles del inquilino | Ninguna | Ninguno | — |
| 2026-06-13 | Antigravity  | + Ajuste responsivo del botón Guardar Cambios y selector en SettingsView | Ninguna | Ninguno | — |
| 2026-06-14 | GitHub Copilot | Fase 30 completa (11/14 tareas): lazy loading, benchmark extendido, EXPLAIN ANALYZE, medición web, revisión N+1 | BF-3009, BF-3012, BF-3013, BF-3014 pendientes | BF-3009 requiere entorno React Native; BF-3012/3013 requieren generación de datos masivos | Pendientes: medición mobile, pruebas de volumen, cursor pagination |
| 2026-06-14 | GitHub Copilot | Fase 31 completa (25/25 documentos): instalación, desarrollo, arquitectura, seguridad, auth, roles, menús, planes, settings, paginación, AppListView, SDK, DB, migraciones, seeds, tests, CI/CD, deploy, troubleshooting, contribución, changelog, ADRs | Ninguna | Ninguno | — |
| 2026-06-14 | GitHub Copilot | Fase 32 completa (12/15 tareas): script `create-app.ts` con reemplazo de nombres, validación, mobile IDs, .env, schema, commit, docs | BF-3208, BF-3211, BF-3212, BF-3215 pendientes | BF-3208 requiere definir flags; BF-3211/3212 requieren Docker; BF-3215 requiere un clon fresco | Pendientes: módulos opcionales, migración automática, tests post-fork, probar fork real |
| 2026-06-14 | GitHub Copilot | Fase 33 completa (7/8 tareas): modelo plantilla+paquetes, versionado, changelogs, guía actualización v2, breaking changes policy, script automatizado | BF-3307 pendiente | BF-3307 requiere un clon fresco del repo + un release real para probar merge | Pendientes: probar actualización real de un fork |
| 2026-06-14 | GitHub Copilot | Fase 34 completa (48/57 tareas): auditoría de todas las funcionalidades, fix de 2 tests, release checklist, changelog v1.0.0 | BF-3419, BF-3421, BF-3434, BF-3437, BF-3438, BF-3443, BF-3453, BF-3455, BF-3456, BF-3457 pendientes | Varios items requieren deploy real, fork real o release publishing | Pendientes: release tag, GitHub Release, backlog v1.1 |
| 2026-06-14 | GitHub Copilot | Mejoras post-release: pageSize configurable por tenant, resiliencia DB/frontend, dedup requests, CORS por env, rate limiting, brute force protection, graceful shutdown, Dockerfile, db scripts, MetricCard, TelemetryView extraído, tipos fuertes | Ninguna | Ninguno | — |

---

# 2. Objetivo del proyecto

Construir una aplicación base SaaS con:

- Aplicación web.
- Aplicación móvil.
- API.
- Base de datos PostgreSQL.
- Arquitectura multitenant.
- Superadministración.
- Seguridad completa.
- Usuarios.
- Roles.
- Permisos.
- Menús dinámicos.
- Menús por rol.
- Planes.
- Suscripciones.
- Configuración por tenant.
- Feature flags.
- Auditoría.
- Componentes reutilizables.
- Listados estandarizados.
- Paginación obligatoria desde el servidor.
- SDK tipado.
- Pruebas automatizadas.
- CI/CD.
- Documentación para forks.

La solución no debe contener lógica específica de inventarios, colegios, salud, propiedades u otro negocio. Debe funcionar como una **fundación técnica reutilizable**.

---

# 3. Stack aprobado

## 3.1 Aplicaciones

| Componente | Tecnología |
|---|---|
| Monorepo | Bun Workspaces + Turborepo |
| Web | React + Vite + TypeScript |
| Mobile | React Native + Expo + TypeScript |
| API | Bun + Hono + TypeScript |
| Base de datos | PostgreSQL |
| ORM | Drizzle ORM |
| Validación | Zod |
| Consultas remotas | TanStack Query |
| Formularios web | React Hook Form |
| Navegación web | React Router |
| Navegación móvil | Expo Router |
| UI web | Componentes propios sobre Radix/shadcn |
| UI mobile | React Native Paper o componentes propios |
| Estado local | Zustand |
| Autenticación | JWT de acceso + refresh token rotativo |
| Contraseñas | Hash seguro con `Bun.password` |
| Logs | Pino o logger estructurado equivalente |
| Documentación API | OpenAPI |
| Contenedores locales | Docker Compose |
| CI | GitHub Actions |

## 3.2 Pruebas

| Capa | Tecnología |
|---|---|
| API unitarias/integración | `bun:test` |
| Web unitarias | Vitest + Testing Library |
| Mobile unitarias | Jest + React Native Testing Library |
| Web E2E | Playwright |
| Mobile E2E | Maestro, en fase posterior |
| Contratos | OpenAPI + validación de esquemas |

---

# 4. Decisiones de arquitectura

## 4.1 Multitenancy

Modelo inicial:

- Una base de datos PostgreSQL.
- Un esquema principal.
- Tablas compartidas.
- Columna `tenant_id` obligatoria en datos del tenant.
- Contexto del tenant resuelto en la API.
- Filtros por tenant obligatorios.
- Row Level Security de PostgreSQL como defensa adicional en tablas críticas.

## 4.2 Identificadores

- Usar UUID.
- Generar UUID desde aplicación o PostgreSQL.
- No exponer IDs secuenciales.
- Todos los IDs se enviarán como string en los contratos JSON.

## 4.3 Fechas

- Guardar fechas en UTC.
- API devuelve ISO 8601.
- Web y mobile convierten a la zona horaria del tenant.
- Cada tenant tendrá una zona horaria configurable.

## 4.4 Eliminación de registros

Por defecto:

- Usar eliminación lógica en entidades administrativas.
- Campos:
  - `is_active`
  - `deleted_at`
  - `deleted_by`
- Usar eliminación física solo para datos temporales o revocables.

## 4.5 Seguridad

- La API es la única fuente de autorización.
- El frontend nunca determina por sí solo si una acción está permitida.
- Los permisos se validan en API.
- Los menús se muestran según permisos y rol.
- Todo acceso tenant debe validar membresía.
- Refresh tokens se almacenan hasheados.
- La contraseña nunca se registra en logs.
- Las credenciales y secretos vienen de variables de entorno.

---

# 5. Estructura objetivo del repositorio

```text
baseforge/
├── apps/
│   ├── api/
│   ├── web/
│   └── mobile/
├── packages/
│   ├── api-client/
│   ├── auth/
│   ├── config/
│   ├── eslint-config/
│   ├── shared/
│   ├── tsconfig/
│   ├── ui-web/
│   ├── ui-mobile/
│   └── validation/
├── database/
│   ├── migrations/
│   ├── seeds/
│   ├── scripts/
│   └── README.md
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── decisions/
│   ├── development/
│   ├── security/
│   └── tenancy/
├── infrastructure/
│   ├── docker/
│   └── github-actions/
├── scripts/
├── .env.example
├── docker-compose.yml
├── package.json
├── turbo.json
├── tsconfig.json
└── README.md
```

---

# 6. Convenciones generales

## 6.1 Nombres

- Código, tablas y campos: inglés.
- Documentación funcional: español.
- Carpetas: `kebab-case`.
- Archivos TypeScript: `kebab-case.ts`.
- Componentes React: `PascalCase.tsx`.
- Variables y funciones: `camelCase`.
- Clases y tipos: `PascalCase`.
- Tablas PostgreSQL: `snake_case`.
- Permisos: `resource.action`.

## 6.2 Permisos

Ejemplos:

```text
users.read
users.create
users.update
users.delete
roles.read
roles.create
roles.update
roles.delete
tenants.read
tenants.create
tenants.update
tenants.suspend
plans.read
plans.create
plans.update
subscriptions.read
subscriptions.update
settings.read
settings.update
audit.read
```

## 6.3 Respuesta estándar de API

Éxito:

```json
{
  "success": true,
  "data": {},
  "meta": null,
  "traceId": "uuid"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos.",
    "details": []
  },
  "traceId": "uuid"
}
```

## 6.4 Contrato estándar de paginación

Petición:

```http
GET /api/v1/users?page=1&pageSize=20&search=juan&sortBy=createdAt&sortDirection=desc
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "items": []
  },
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 120,
      "totalPages": 6,
      "hasPreviousPage": false,
      "hasNextPage": true
    }
  },
  "traceId": "uuid"
}
```

Reglas:

- `page` mínimo: 1.
- `pageSize` por defecto: 20.
- `pageSize` máximo: 100.
- Todos los filtros se aplican en el servidor.
- Todo ordenamiento se aplica en el servidor.
- Ningún listado administrativo cargará todos los registros.
- El frontend no calcula la cantidad total de páginas.
- El `ListView` consume siempre este contrato.

---

# 7. Fases del proyecto

1. Preparación y repositorio.
2. Monorepo y herramientas.
3. Infraestructura local.
4. Base de datos.
5. Núcleo de la API.
6. Seguridad y autenticación.
7. Multitenancy.
8. Usuarios, roles y permisos.
9. Menús dinámicos.
10. Superadmin y tenants.
11. Planes y suscripciones.
12. Configuración y feature flags.
13. Auditoría y observabilidad.
14. Aplicación web.
15. Componentes web reutilizables.
16. Aplicación móvil.
17. Componentes mobile reutilizables.
18. SDK y contratos compartidos.
19. Pruebas.
20. CI/CD.
21. Seguridad avanzada.
22. Documentación y creación de forks.
23. Release 1.0.

---

# 8. Fase 0 — Preparación y decisiones

## Objetivo

Alinear el alcance, decisiones técnicas y criterios de éxito.

## Tareas

- [ ] BF-0001 Confirmar nombre definitivo del proyecto.
- [ ] BF-0002 Definir licencia del repositorio.
- [ ] BF-0003 Definir si el repositorio será privado o público.
- [ ] BF-0004 Definir proveedor inicial de Git.
- [ ] BF-0005 Definir ambientes: local, development, staging y production.
- [ ] BF-0006 Definir proveedor inicial de PostgreSQL para producción.
- [ ] BF-0007 Definir proveedor inicial de hosting de API.
- [ ] BF-0008 Definir proveedor inicial de hosting web.
- [ ] BF-0009 Definir estrategia de publicación mobile.
- [ ] BF-0010 Crear documento de decisiones de arquitectura.
- [ ] BF-0011 Definir alcance exacto del MVP.
- [ ] BF-0012 Definir funcionalidades pospuestas.
- [ ] BF-0013 Definir política de versiones.
- [ ] BF-0014 Definir estrategia de ramas.
- [ ] BF-0015 Definir formato de commits.

## Decisiones sugeridas

```text
Repositorio: GitHub privado
Ramas: main + develop + feature/*
Commits: Conventional Commits
Versionado: Semantic Versioning
Ambientes: local, development, staging, production
```

## Criterio de terminado

- Existe un documento de decisiones.
- El MVP está delimitado.
- No quedan decisiones críticas sin propietario.

---

# 9. Fase 1 — Crear repositorio y monorepo

## Objetivo

Crear la estructura base para web, mobile, API y paquetes compartidos.

## Tareas

- [ ] BF-0101 Crear el repositorio Git.
- [ ] BF-0102 Clonar el repositorio localmente.
- [ ] BF-0103 Instalar Bun.
- [ ] BF-0104 Inicializar proyecto raíz.
- [ ] BF-0105 Configurar Bun Workspaces.
- [ ] BF-0106 Instalar y configurar Turborepo.
- [ ] BF-0107 Crear carpetas `apps`, `packages`, `database`, `docs`, `scripts` e `infrastructure`.
- [ ] BF-0108 Configurar `.gitignore`.
- [ ] BF-0109 Crear `.editorconfig`.
- [ ] BF-0110 Configurar TypeScript base.
- [ ] BF-0111 Configurar ESLint.
- [ ] BF-0112 Configurar Prettier.
- [ ] BF-0113 Configurar scripts raíz.
- [ ] BF-0114 Crear `README.md` inicial.
- [ ] BF-0115 Crear `.env.example`.
- [ ] BF-0116 Configurar Husky o alternativa para Git hooks.
- [ ] BF-0117 Configurar `lint-staged`.
- [ ] BF-0118 Configurar validación de commits.
- [ ] BF-0119 Crear primer commit.
- [ ] BF-0120 Crear tag `v0.0.1`.

## Comandos sugeridos

```bash
mkdir baseforge
cd baseforge
git init
bun init -y
bun add -D turbo typescript eslint prettier
mkdir -p apps packages database docs infrastructure scripts
```

## Scripts raíz esperados

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "format": "prettier --write .",
    "clean": "turbo clean && rm -rf node_modules"
  }
}
```

## Criterio de terminado

- `bun install` funciona.
- `bun run lint` funciona.
- `bun run typecheck` funciona.
- El repositorio tiene una estructura coherente.
- El primer commit está publicado.

---

# 10. Fase 2 — Crear aplicaciones base

## 10.1 API

- [ ] BF-0201 Crear `apps/api`.
- [ ] BF-0202 Instalar Hono.
- [ ] BF-0203 Crear servidor HTTP.
- [ ] BF-0204 Crear endpoint `/health`.
- [ ] BF-0205 Crear endpoint `/ready`.
- [ ] BF-0206 Configurar variables de entorno.
- [ ] BF-0207 Configurar manejo global de errores.
- [ ] BF-0208 Configurar ID de trazabilidad por petición.
- [ ] BF-0209 Configurar logger estructurado.
- [ ] BF-0210 Crear versión base `/api/v1`.
- [ ] BF-0211 Configurar CORS.
- [ ] BF-0212 Configurar seguridad de headers.
- [ ] BF-0213 Crear pruebas del health check.

## 10.2 Web

- [ ] BF-0220 Crear `apps/web` con React, Vite y TypeScript.
- [ ] BF-0221 Configurar alias de importación.
- [ ] BF-0222 Configurar React Router.
- [ ] BF-0223 Configurar TanStack Query.
- [ ] BF-0224 Configurar Zustand.
- [ ] BF-0225 Configurar React Hook Form.
- [ ] BF-0226 Configurar tema claro y oscuro.
- [ ] BF-0227 Crear página temporal de inicio.
- [ ] BF-0228 Configurar ESLint y TypeScript.
- [ ] BF-0229 Crear primera prueba web.

## 10.3 Mobile

- [ ] BF-0240 Crear `apps/mobile` con Expo.
- [ ] BF-0241 Configurar Expo Router.
- [ ] BF-0242 Configurar TypeScript.
- [ ] BF-0243 Configurar TanStack Query.
- [ ] BF-0244 Configurar Zustand.
- [ ] BF-0245 Configurar almacenamiento seguro.
- [ ] BF-0246 Crear tema claro y oscuro.
- [ ] BF-0247 Crear pantalla temporal de inicio.
- [ ] BF-0248 Configurar variables por ambiente.
- [ ] BF-0249 Crear primera prueba mobile.

## Criterio de terminado

- API, web y mobile levantan desde el monorepo.
- `bun run dev` inicia los proyectos esperados.
- Cada aplicación compila.
- Cada aplicación tiene al menos una prueba pasando.

---

# 11. Fase 3 — Infraestructura local

## Objetivo

Tener un entorno local reproducible.

## Tareas

- [ ] BF-0301 Crear `docker-compose.yml`.
- [ ] BF-0302 Agregar PostgreSQL.
- [ ] BF-0303 Agregar volumen persistente.
- [ ] BF-0304 Agregar health check de PostgreSQL.
- [ ] BF-0305 Definir usuario, contraseña y base local.
- [ ] BF-0306 Agregar PgAdmin opcional.
- [ ] BF-0307 Crear script `db:start`.
- [ ] BF-0308 Crear script `db:stop`.
- [ ] BF-0309 Crear script `db:reset`.
- [ ] BF-0310 Documentar conexión local.
- [ ] BF-0311 Validar conexión desde API.
- [ ] BF-0312 Crear archivo `.env.local.example`.
- [ ] BF-0313 Evitar que secretos entren al repositorio.

## Docker Compose esperado

Servicios mínimos:

```text
postgres
pgadmin opcional
```

## Criterio de terminado

- Un desarrollador nuevo puede levantar PostgreSQL con un comando.
- La API se conecta a la base.
- La base conserva datos entre reinicios.
- Existe un procedimiento documentado para resetearla.

---

# 12. Fase 4 — Diseño de base de datos

## Objetivo

Crear el modelo central de seguridad, multitenancy y SaaS.

## 12.1 Tablas de plataforma

- [ ] BF-0401 Diseñar tabla `platform_users`.
- [ ] BF-0402 Diseñar tabla `tenants`.
- [ ] BF-0403 Diseñar tabla `tenant_users`.
- [ ] BF-0404 Diseñar tabla `roles`.
- [ ] BF-0405 Diseñar tabla `permissions`.
- [ ] BF-0406 Diseñar tabla `role_permissions`.
- [ ] BF-0407 Diseñar tabla `user_roles`.
- [ ] BF-0408 Diseñar tabla `menus`.
- [ ] BF-0409 Diseñar tabla `role_menus`.
- [ ] BF-0410 Diseñar tabla `plans`.
- [ ] BF-0411 Diseñar tabla `features`.
- [ ] BF-0412 Diseñar tabla `plan_features`.
- [ ] BF-0413 Diseñar tabla `subscriptions`.
- [ ] BF-0414 Diseñar tabla `tenant_features`.
- [ ] BF-0415 Diseñar tabla `tenant_limits`.
- [ ] BF-0416 Diseñar tabla `tenant_usage`.
- [ ] BF-0417 Diseñar tabla `tenant_settings`.
- [ ] BF-0418 Diseñar tabla `refresh_tokens`.
- [ ] BF-0419 Diseñar tabla `password_reset_tokens`.
- [ ] BF-0420 Diseñar tabla `user_sessions`.
- [ ] BF-0421 Diseñar tabla `audit_logs`.
- [ ] BF-0422 Diseñar tabla `notifications`.
- [ ] BF-0423 Diseñar tabla `files`.
- [ ] BF-0424 Diseñar tabla `api_keys`.
- [ ] BF-0425 Diseñar tabla `webhooks`.
- [ ] BF-0426 Diseñar tabla `webhook_deliveries`.

## 12.2 Campos comunes

Todas las tablas administrativas relevantes deben evaluar:

```text
id
tenant_id
created_at
created_by
updated_at
updated_by
deleted_at
deleted_by
is_active
version
```

No todos los campos aplican a todas las tablas.

## 12.3 Índices

- [ ] BF-0430 Crear índices por `tenant_id`.
- [ ] BF-0431 Crear índices para búsquedas frecuentes.
- [ ] BF-0432 Crear índices únicos compuestos por tenant.
- [ ] BF-0433 Crear índices para tokens.
- [ ] BF-0434 Crear índices para auditoría por fecha.
- [ ] BF-0435 Revisar índices de claves foráneas.
- [ ] BF-0436 Documentar estrategia de índices.

Ejemplos:

```sql
UNIQUE (tenant_id, email)
UNIQUE (tenant_id, code)
INDEX (tenant_id, created_at)
INDEX (tenant_id, is_active)
```

## 12.4 Restricciones

- [ ] BF-0440 Agregar claves foráneas.
- [ ] BF-0441 Agregar restricciones `NOT NULL`.
- [ ] BF-0442 Agregar validaciones de estado.
- [ ] BF-0443 Evitar membresías duplicadas.
- [ ] BF-0444 Evitar permisos duplicados.
- [ ] BF-0445 Evitar roles duplicados dentro del tenant.
- [ ] BF-0446 Evitar planes con código duplicado.
- [ ] BF-0447 Definir reglas de borrado.

## 12.5 Migraciones

- [ ] BF-0450 Configurar Drizzle.
- [ ] BF-0451 Crear primera migración.
- [ ] BF-0452 Crear comando `db:generate`.
- [ ] BF-0453 Crear comando `db:migrate`.
- [ ] BF-0454 Crear comando `db:seed`.
- [ ] BF-0455 Crear comando `db:studio`.
- [ ] BF-0456 Probar migración desde base vacía.
- [ ] BF-0457 Probar rollback o estrategia de reversión.
- [ ] BF-0458 Documentar migraciones.

## Criterio de terminado

- El modelo está documentado.
- Una base vacía puede crearse completamente con migraciones.
- Los índices críticos existen.
- Los datos de prueba pueden cargarse mediante seeds.

---

# 13. Fase 5 — Seeds iniciales

## Objetivo

Tener datos mínimos para desarrollo y pruebas.

## Tareas

- [ ] BF-0501 Crear usuario superadmin inicial.
- [ ] BF-0502 Crear tenant demo.
- [ ] BF-0503 Crear rol `SUPER_ADMIN`.
- [ ] BF-0504 Crear rol `TENANT_ADMIN`.
- [ ] BF-0505 Crear rol `TENANT_USER`.
- [ ] BF-0506 Crear catálogo inicial de permisos.
- [ ] BF-0507 Crear menú inicial.
- [ ] BF-0508 Asociar permisos al superadmin.
- [ ] BF-0509 Asociar permisos al administrador del tenant.
- [ ] BF-0510 Crear plan `FREE`.
- [ ] BF-0511 Crear plan `BASIC`.
- [ ] BF-0512 Crear plan `PRO`.
- [ ] BF-0513 Crear features iniciales.
- [ ] BF-0514 Crear suscripción demo.
- [ ] BF-0515 Crear configuraciones por defecto.
- [ ] BF-0516 Crear script idempotente.
- [ ] BF-0517 Evitar contraseñas reales en seeds.
- [ ] BF-0518 Documentar credenciales locales de demo.

## Criterio de terminado

- Ejecutar seeds varias veces no duplica información.
- Es posible iniciar sesión como superadmin y tenant admin.
- El tenant demo tiene plan y configuración.

---

# 14. Fase 6 — Núcleo de la API

## Objetivo

Construir una API modular, segura y consistente.

## 14.1 Estructura de módulos

```text
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── permissions/
│   ├── menus/
│   ├── tenants/
│   ├── plans/
│   ├── subscriptions/
│   ├── settings/
│   ├── audit/
│   ├── notifications/
│   └── files/
├── middlewares/
├── common/
├── database/
├── config/
└── main.ts
```

## Tareas

- [ ] BF-0601 Definir patrón interno de módulos.
- [ ] BF-0602 Definir patrón de controlador o handler.
- [ ] BF-0603 Definir capa de servicio.
- [ ] BF-0604 Definir capa de repositorio.
- [ ] BF-0605 Definir DTOs.
- [ ] BF-0606 Definir validaciones Zod.
- [ ] BF-0607 Crear clase o tipo de errores de dominio.
- [ ] BF-0608 Crear manejo global de errores.
- [ ] BF-0609 Crear respuesta estándar.
- [ ] BF-0610 Crear middleware de trazabilidad.
- [ ] BF-0611 Crear middleware de logging.
- [ ] BF-0612 Crear middleware de límite de tamaño.
- [ ] BF-0613 Crear validación de variables de entorno.
- [ ] BF-0614 Crear utilidades de fechas.
- [ ] BF-0615 Crear utilidades de paginación.
- [ ] BF-0616 Crear utilidades de ordenamiento seguro.
- [ ] BF-0617 Crear utilidades de filtros seguros.
- [ ] BF-0618 Crear documentación OpenAPI.
- [ ] BF-0619 Publicar endpoint de documentación en development.
- [ ] BF-0620 Ocultar o proteger documentación en production.

## Criterio de terminado

- Existe un patrón consistente para nuevos módulos.
- Los errores tienen códigos estables.
- La API genera `traceId`.
- OpenAPI refleja los endpoints existentes.

---

# 15. Fase 7 — Autenticación y sesiones

## Objetivo

Implementar autenticación completa y segura.

## 15.1 Login

- [ ] BF-0701 Crear endpoint de login.
- [ ] BF-0702 Validar email y contraseña.
- [ ] BF-0703 Validar usuario activo.
- [ ] BF-0704 Validar tenant activo.
- [ ] BF-0705 Validar membresía activa.
- [ ] BF-0706 Generar access token.
- [ ] BF-0707 Generar refresh token.
- [ ] BF-0708 Guardar hash del refresh token.
- [ ] BF-0709 Registrar sesión.
- [ ] BF-0710 Registrar login en auditoría.
- [ ] BF-0711 Evitar enumeración de usuarios.
- [ ] BF-0712 Implementar bloqueo temporal por intentos.

## 15.2 Refresh token

- [ ] BF-0720 Crear endpoint de refresh.
- [ ] BF-0721 Validar token y sesión.
- [ ] BF-0722 Rotar refresh token.
- [ ] BF-0723 Revocar token anterior.
- [ ] BF-0724 Detectar reutilización de token.
- [ ] BF-0725 Revocar familia de sesión si hay reutilización.
- [ ] BF-0726 Registrar evento de seguridad.

## 15.3 Logout

- [ ] BF-0730 Crear logout de sesión actual.
- [ ] BF-0731 Crear logout de todas las sesiones.
- [ ] BF-0732 Revocar refresh tokens.
- [ ] BF-0733 Registrar auditoría.

## 15.4 Recuperación de contraseña

- [x] BF-0740 Crear solicitud de recuperación.
- [x] BF-0741 Generar token de un solo uso.
- [x] BF-0742 Guardar hash del token.
- [x] BF-0743 Definir expiración.
- [x] BF-0744 Crear plantilla de correo.
- [x] BF-0745 Crear endpoint de cambio por token.
- [x] BF-0746 Invalidar token después de usarlo.
- [x] BF-0747 Cerrar sesiones después del cambio.
- [x] BF-0748 Registrar auditoría.

## 15.5 Claims del access token

Mínimo:

```json
{
  "sub": "user-id",
  "tenantId": "tenant-id",
  "sessionId": "session-id",
  "roles": ["TENANT_ADMIN"],
  "permissions": ["users.read", "users.create"],
  "tokenVersion": 1
}
```

## Criterio de terminado

- Login, refresh y logout funcionan.
- Los refresh tokens son rotativos.
- Las contraseñas se almacenan hasheadas.
- Existen pruebas de rutas felices y fallos.
- Las sesiones pueden revocarse.

---

# 16. Fase 8 — Contexto multitenant

## Objetivo

Evitar acceso cruzado entre tenants.

## Tareas

- [ ] BF-0801 Definir cómo se identifica el tenant.
- [ ] BF-0802 Crear middleware `tenant-context`.
- [ ] BF-0803 Resolver tenant desde el token.
- [ ] BF-0804 Validar existencia del tenant.
- [ ] BF-0805 Validar estado del tenant.
- [ ] BF-0806 Validar membresía del usuario.
- [ ] BF-0807 Inyectar contexto tenant en la petición.
- [ ] BF-0808 Prohibir `tenant_id` arbitrario desde el body.
- [ ] BF-0809 Crear helper obligatorio de repositorios tenant.
- [ ] BF-0810 Crear pruebas de aislamiento.
- [ ] BF-0811 Intentar acceso cruzado intencionalmente.
- [ ] BF-0812 Añadir RLS a tablas críticas.
- [ ] BF-0813 Crear política RLS por tenant.
- [ ] BF-0814 Documentar excepciones de superadmin.
- [ ] BF-0815 Registrar suplantación de tenant.
- [ ] BF-0816 Crear encabezado visual cuando el superadmin opere sobre un tenant.

## Regla obligatoria

No se permite:

```ts
db.select().from(users);
```

Debe existir contexto:

```ts
repository.list({ tenantId, ...filters });
```

## Criterio de terminado

- No existe acceso cruzado en pruebas.
- Todo repositorio tenant requiere `tenantId`.
- El superadmin usa un flujo explícito y auditable.

---

# 17. Fase 9 — Autorización, roles y permisos

## Objetivo

Implementar RBAC reutilizable.

## Tareas

- [ ] BF-0901 Crear catálogo de permisos.
- [ ] BF-0902 Crear CRUD de roles.
- [ ] BF-0903 Crear asignación de permisos a roles.
- [ ] BF-0904 Crear asignación de roles a usuarios.
- [ ] BF-0905 Crear middleware `requirePermission`.
- [ ] BF-0906 Crear middleware `requireRole`.
- [ ] BF-0907 Crear cache de permisos con invalidación.
- [ ] BF-0908 Invalidar cache al modificar roles.
- [ ] BF-0909 Evitar eliminación de roles del sistema.
- [ ] BF-0910 Evitar que un tenant gestione roles de otro.
- [ ] BF-0911 Impedir que un administrador se quite su último rol crítico.
- [ ] BF-0912 Definir permisos del superadmin.
- [ ] BF-0913 Crear endpoint `GET /me/permissions`.
- [ ] BF-0914 Crear endpoint `GET /me/context`.
- [ ] BF-0915 Crear pruebas por permiso.
- [ ] BF-0916 Crear pruebas de denegación.
- [ ] BF-0917 Documentar matriz de permisos.

## Criterio de terminado

- Cada endpoint sensible declara permisos.
- Los permisos se verifican en API.
- Web y mobile pueden obtener el contexto autorizado.
- Existe una matriz documentada.

---

# 18. Fase 10 — Usuarios

## Objetivo

Gestionar usuarios de la plataforma y de cada tenant.

## Tareas API

- [ ] BF-1001 Crear listado paginado de usuarios.
- [ ] BF-1002 Crear búsqueda por nombre y email.
- [ ] BF-1003 Crear filtros por estado y rol.
- [ ] BF-1004 Crear ordenamiento seguro.
- [ ] BF-1005 Crear usuario.
- [ ] BF-1006 Editar usuario.
- [ ] BF-1007 Activar usuario.
- [ ] BF-1008 Desactivar usuario.
- [ ] BF-1009 Reenviar invitación.
- [ ] BF-1010 Restablecer credenciales.
- [ ] BF-1011 Consultar detalle.
- [ ] BF-1012 Consultar sesiones.
- [ ] BF-1013 Revocar sesiones.
- [ ] BF-1014 Asignar roles.
- [ ] BF-1015 Validar límites del plan.
- [ ] BF-1016 Registrar auditoría.

## Tareas web

- [ ] BF-1020 Crear listado de usuarios con `AppListView`.
- [ ] BF-1021 Crear filtros.
- [ ] BF-1022 Crear formulario.
- [ ] BF-1023 Crear asignación de roles.
- [ ] BF-1024 Crear confirmación para desactivar.
- [ ] BF-1025 Mostrar errores de validación.
- [ ] BF-1026 Aplicar permisos a botones.
- [ ] BF-1027 Crear vista de sesiones.

## Tareas mobile

- [ ] BF-1040 Crear listado básico de usuarios.
- [ ] BF-1041 Crear detalle.
- [ ] BF-1042 Permitir acciones autorizadas.
- [ ] BF-1043 Adaptar paginación a scroll infinito o páginas.
- [ ] BF-1044 Mostrar estados de carga y vacío.

## Criterio de terminado

- CRUD administrativo completo.
- Paginación en servidor.
- Permisos en API y UI.
- Auditoría generada.

---

# 19. Fase 11 — Menús dinámicos

## Objetivo

Cargar el menú desde la base de datos según rol y permisos.

## Modelo mínimo

```text
id
parent_id
code
label
route
icon
order
platform
required_permission
is_visible
is_active
```

Valores posibles de `platform`:

```text
WEB
MOBILE
BOTH
```

## Tareas

- [ ] BF-1101 Crear CRUD de menús.
- [ ] BF-1102 Permitir jerarquía.
- [ ] BF-1103 Validar rutas duplicadas.
- [ ] BF-1104 Configurar orden.
- [ ] BF-1105 Asociar menús a roles.
- [ ] BF-1106 Asociar permiso requerido.
- [ ] BF-1107 Crear endpoint `GET /me/menu`.
- [ ] BF-1108 Filtrar por plataforma.
- [ ] BF-1109 Filtrar por permisos.
- [ ] BF-1110 Filtrar por feature del plan.
- [ ] BF-1111 Construir árbol en API.
- [ ] BF-1112 Crear navegación web dinámica.
- [ ] BF-1113 Crear navegación mobile dinámica.
- [ ] BF-1114 Crear fallback para rutas no autorizadas.
- [ ] BF-1115 Crear pruebas de árbol.
- [ ] BF-1116 Crear pruebas de visibilidad.

## Criterio de terminado

- El frontend no contiene un menú principal quemado.
- El menú cambia según usuario, tenant y plan.
- Rutas directas no autorizadas son bloqueadas.

---

# 20. Fase 12 — Superadmin y gestión de tenants

## Objetivo

Administrar la plataforma y los tenants.

## Funciones

- Crear tenant.
- Editar tenant.
- Activar.
- Suspender.
- Asignar plan.
- Consultar consumo.
- Consultar usuarios.
- Gestionar configuración.
- Operar en modo soporte.
- Ver auditoría.

## Tareas API

- [ ] BF-1201 Crear listado paginado de tenants.
- [ ] BF-1202 Crear filtros por estado y plan.
- [ ] BF-1203 Crear tenant.
- [ ] BF-1204 Crear administrador inicial.
- [ ] BF-1205 Crear configuración por defecto.
- [ ] BF-1206 Crear suscripción inicial.
- [ ] BF-1207 Editar tenant.
- [ ] BF-1208 Suspender tenant.
- [ ] BF-1209 Reactivar tenant.
- [ ] BF-1210 Consultar detalle.
- [ ] BF-1211 Consultar usuarios.
- [ ] BF-1212 Consultar consumo.
- [ ] BF-1213 Crear modo soporte.
- [ ] BF-1214 Establecer expiración del modo soporte.
- [ ] BF-1215 Registrar auditoría del modo soporte.
- [ ] BF-1216 Prohibir cambios sensibles sin permiso adicional.

## Tareas web

- [ ] BF-1220 Crear layout de superadmin.
- [ ] BF-1221 Crear dashboard global.
- [ ] BF-1222 Crear listado de tenants.
- [ ] BF-1223 Crear formulario de tenant.
- [ ] BF-1224 Crear detalle de tenant.
- [ ] BF-1225 Crear pantalla de suscripción.
- [ ] BF-1226 Crear pantalla de configuración.
- [ ] BF-1227 Crear pantalla de consumo.
- [ ] BF-1228 Crear botón de suspender.
- [ ] BF-1229 Crear modo soporte.
- [ ] BF-1230 Mostrar banner de modo soporte.

## Criterio de terminado

- El superadmin puede gestionar el ciclo de vida de un tenant.
- Toda operación crítica queda auditada.
- El modo soporte es visible, limitado y temporal.

---

# 21. Fase 13 — Planes, features, límites y suscripciones

## Objetivo

Controlar capacidades y uso por plan.

## 21.1 Planes

- [ ] BF-1301 Crear CRUD de planes.
- [ ] BF-1302 Definir código único.
- [ ] BF-1303 Definir precio informativo.
- [ ] BF-1304 Definir periodicidad.
- [ ] BF-1305 Definir estado.
- [ ] BF-1306 Evitar eliminar planes en uso.

## 21.2 Features

- [ ] BF-1310 Crear catálogo de features.
- [ ] BF-1311 Asociar features a planes.
- [ ] BF-1312 Permitir override por tenant.
- [ ] BF-1313 Crear servicio `hasFeature`.
- [ ] BF-1314 Crear middleware `requireFeature`.
- [ ] BF-1315 Crear componente web `FeatureGuard`.
- [ ] BF-1316 Crear componente mobile `FeatureGuard`.

## 21.3 Límites

- [ ] BF-1320 Definir límites por plan.
- [ ] BF-1321 Definir límites personalizados.
- [ ] BF-1322 Crear servicio `checkLimit`.
- [ ] BF-1323 Validar límite de usuarios.
- [ ] BF-1324 Validar límite de almacenamiento.
- [ ] BF-1325 Validar límite de API.
- [ ] BF-1326 Definir acciones al alcanzar límite.
- [ ] BF-1327 Mostrar consumo en UI.
- [ ] BF-1328 Crear alertas de consumo.

## 21.4 Suscripciones

- [ ] BF-1340 Crear suscripción.
- [ ] BF-1341 Cambiar plan.
- [ ] BF-1342 Cancelar.
- [ ] BF-1343 Renovar.
- [ ] BF-1344 Definir prueba gratuita.
- [ ] BF-1345 Definir período de gracia.
- [ ] BF-1346 Suspender por vencimiento.
- [ ] BF-1347 Crear job de validación.
- [ ] BF-1348 Crear historial de cambios.
- [ ] BF-1349 Preparar interfaz para pasarela futura.

## Estados sugeridos

```text
TRIALING
ACTIVE
PAST_DUE
GRACE_PERIOD
SUSPENDED
CANCELED
EXPIRED
```

## Criterio de terminado

- Las features se habilitan según plan.
- Los límites se validan en API.
- La suscripción controla el acceso sin depender del frontend.
- La integración con una pasarela puede agregarse después.

---

# 22. Fase 14 — Configuración por tenant

## Objetivo

Permitir personalización sin modificar código.

## Tipos de configuración

```text
STRING
NUMBER
BOOLEAN
JSON
SECRET_REFERENCE
```

## Grupos iniciales

```text
general
branding
localization
notifications
security
email
mobile
integrations
```

## Tareas

- [x] BF-1401 Crear catálogo de claves permitidas.
- [x] BF-1402 Crear valores por defecto.
- [x] BF-1403 Crear endpoint de lectura.
- [x] BF-1404 Crear endpoint de actualización.
- [x] BF-1405 Validar tipos.
- [x] BF-1406 Separar configuraciones públicas y privadas.
- [x] BF-1407 Prohibir retornar secretos.
- [x] BF-1408 Crear cache de configuración.
- [x] BF-1409 Invalidar cache al actualizar.
- [x] BF-1410 Crear pantalla web por secciones.
- [~] BF-1411 Crear configuración mobile básica.
- [x] BF-1412 Aplicar branding dinámico.
- [~] BF-1413 Aplicar zona horaria.
- [~] BF-1414 Aplicar moneda.
- [~] BF-1415 Aplicar formato de fecha.
- [x] BF-1416 Registrar auditoría.

## Criterio de terminado

- Cada tenant puede tener configuración propia.
- Los valores se validan.
- Los secretos no salen de la API.
- El branding se refleja en web y mobile.

---

# 23. Fase 15 — Auditoría

## Objetivo

Registrar acciones relevantes de seguridad y negocio.

## Datos mínimos

```text
id
tenant_id
actor_user_id
action
entity_type
entity_id
before_data
after_data
ip_address
user_agent
trace_id
created_at
```

## Tareas

- [x] BF-1501 Crear servicio de auditoría.
- [x] BF-1502 Registrar login.
- [x] BF-1503 Registrar logout.
- [x] BF-1504 Registrar intentos fallidos.
- [x] BF-1505 Registrar usuarios.
- [x] BF-1506 Registrar roles y permisos.
- [x] BF-1507 Registrar tenants.
- [x] BF-1508 Registrar planes.
- [x] BF-1509 Registrar suscripciones.
- [x] BF-1510 Registrar configuraciones.
- [x] BF-1511 Registrar modo soporte.
- [x] BF-1512 Crear listado paginado.
- [x] BF-1513 Crear filtros.
- [x] BF-1514 Enmascarar datos sensibles.
- [~] BF-1515 Definir política de retención.
- [~] BF-1516 Crear exportación controlada.
- [~] BF-1517 Crear pruebas.

## Criterio de terminado

- Las operaciones críticas generan auditoría.
- No se almacenan contraseñas ni tokens.
- Los logs pueden filtrarse por tenant, actor y fecha.

---

# 24. Fase 16 — Layout web

## Objetivo

Crear un shell web reutilizable y profesional.

## Componentes

- Login layout.
- Application layout.
- Superadmin layout.
- Sidebar.
- Topbar.
- Breadcrumb.
- Selector de tenant.
- Perfil.
- Notificaciones.
- Tema.
- Área de contenido.
- Página 401.
- Página 403.
- Página 404.
- Página 500.
- Mantenimiento.
- Suscripción vencida.

## Tareas

- [x] BF-1601 Crear sistema de diseño.
- [x] BF-1602 Definir tokens visuales.
- [x] BF-1603 Definir tipografía.
- [x] BF-1604 Crear temas claro y oscuro.
- [x] BF-1605 Crear layout de autenticación.
- [x] BF-1606 Crear layout principal.
- [x] BF-1607 Crear sidebar responsive.
- [x] BF-1608 Crear topbar.
- [x] BF-1609 Crear breadcrumb.
- [x] BF-1610 Crear selector de tenant.
- [x] BF-1611 Crear menú de usuario.
- [x] BF-1612 Crear centro de notificaciones.
- [x] BF-1613 Crear páginas de error.
- [x] BF-1614 Crear skeleton global.
- [x] BF-1615 Crear boundary de errores.
- [~] BF-1616 Validar accesibilidad.
- [x] BF-1617 Validar responsive.
- [~] BF-1618 Crear pruebas visuales básicas.

## Criterio de terminado

- Funciona en escritorio, tablet y móvil web.
- Soporta tema claro y oscuro.
- El menú es dinámico.
- Las rutas protegidas funcionan.

---

# 25. Fase 17 — `AppListView` web

## Objetivo

Crear el componente estándar para todos los listados web.

## Propiedades mínimas

```ts
type AppListViewProps<T> = {
  title: string;
  queryKey: readonly unknown[];
  fetcher: (query: ListQuery) => Promise<PagedResult<T>>;
  columns: ColumnDefinition<T>[];
  filters?: FilterDefinition[];
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction<T>[];
  defaultPageSize?: number;
  allowedPageSizes?: number[];
  searchPlaceholder?: string;
  emptyState?: React.ReactNode;
  permissionPrefix?: string;
};
```

## Funciones obligatorias

- [x] BF-1701 Paginación server-side.
- [x] BF-1702 Selector de tamaño de página.
- [x] BF-1703 Búsqueda con debounce.
- [x] BF-1704 Ordenamiento server-side.
- [x] BF-1705 Filtros server-side.
- [x] BF-1706 Acciones por fila.
- [x] BF-1707 Acciones masivas.
- [x] BF-1708 Selección de filas.
- [x] BF-1709 Estado de carga.
- [x] BF-1710 Skeleton.
- [x] BF-1711 Empty state.
- [x] BF-1712 Estado de error.
- [x] BF-1713 Reintentar.
- [~] BF-1714 Sincronizar filtros con URL.
- [x] BF-1715 Restablecer filtros.
- [~] BF-1716 Guardar preferencias opcionalmente.
- [~] BF-1717 Ocultar acciones por permiso.
- [x] BF-1718 Exportación opcional.
- [x] BF-1719 Soporte responsive.
- [~] BF-1720 Pruebas unitarias.
- [~] BF-1721 Pruebas de integración.
- [~] BF-1722 Documentar ejemplos.

## Regla arquitectónica

Todos los listados nuevos deben usar `AppListView`, salvo excepción documentada.

## Criterio de terminado

- El listado de usuarios funciona con el componente.
- El listado de tenants funciona con el mismo componente.
- No existe paginación duplicada en las pantallas.

---

# 26. Fase 18 — Componentes web reutilizables

## Componentes

- [x] BF-1801 `AppPage`.
- [x] BF-1802 `PageHeader`. (incluido en `AppPage`)
- [x] BF-1803 `AppListView`.
- [x] BF-1804 `AppForm`.
- [x] BF-1805 `FormSection`.
- [x] BF-1806 `AppDialog`.
- [x] BF-1807 `ConfirmDialog`.
- [x] BF-1808 `DeleteConfirmDialog`. (usar `ConfirmDialog` con `variant="danger"`)
- [x] BF-1809 `PermissionGuard`.
- [x] BF-1810 `FeatureGuard`.
- [x] BF-1811 `TenantGuard`.
- [x] BF-1812 `StatusBadge`.
- [x] BF-1813 `EmptyState`.
- [x] BF-1814 `ErrorState`.
- [x] BF-1815 `LoadingState`.
- [x] BF-1816 `AppTable`. (usar `AppListView` como reemplazo)
- [x] BF-1817 `AppPagination`. (incluido en `AppListView`)
- [x] BF-1818 `AppSearch`. (incluido en `AppListView`)
- [x] BF-1819 `FilterPanel`. (incluido en `AppListView`)
- [x] BF-1820 `DateRangePicker`.
- [x] BF-1821 `FileUploader`.
- [x] BF-1822 `AvatarUploader`.
- [x] BF-1823 `ThemeSwitcher`.
- [x] BF-1824 `TenantSwitcher`. (incluido en `App.tsx`)
- [x] BF-1825 `NotificationCenter`. (incluido en `App.tsx`)
- [x] BF-1826 `AuditTimeline`.
- [~] BF-1827 Crear Storybook o catálogo equivalente.
- [~] BF-1828 Documentar todos los componentes.

## Criterio de terminado

- Los componentes están en `packages/ui-web`.
- No dependen directamente de un módulo de negocio.
- Tienen ejemplos y tipos.
- Los componentes críticos tienen pruebas.

---

# 27. Fase 19 — Layout mobile

## Objetivo

Crear una base móvil reusable y nativa.

## Navegación

- Stack de autenticación.
- Tabs principales.
- Drawer opcional.
- Rutas protegidas.
- Rutas por permisos.
- Rutas por feature.
- Deep links.

## Tareas

- [x] BF-1901 Crear pantalla de splash.
- [x] BF-1902 Crear login.
- [x] BF-1903 Crear recuperación de contraseña.
- [x] BF-1904 Crear navegación protegida.
- [x] BF-1905 Crear tabs.
- [-] BF-1906 Crear drawer opcional.
- [-] BF-1907 Cargar menú dinámico.
- [x] BF-1908 Crear pantalla de inicio.
- [x] BF-1909 Crear perfil.
- [-] BF-1910 Crear configuración.
- [-] BF-1911 Crear notificaciones.
- [x] BF-1912 Crear tema claro y oscuro.
- [x] BF-1913 Guardar tokens en almacenamiento seguro.
- [x] BF-1914 Restaurar sesión.
- [-] BF-1915 Rotar refresh token.
- [x] BF-1916 Cerrar sesión.
- [x] BF-1917 Manejar pérdida de conectividad.
- [x] BF-1918 Crear páginas de error.
- [x] BF-1919 Configurar deep linking.
- [x] BF-1920 Validar Android.
- [x] BF-1921 Validar iOS cuando esté disponible.

## Criterio de terminado

- Mobile inicia sesión y restaura sesión.
- Los tokens se almacenan de forma segura.
- El menú respeta permisos y plan.
- Funciona al menos en Android físico.

---

# 28. Fase 20 — `AppListView` mobile

## Objetivo

Estandarizar listados mobile sin intentar copiar una tabla web.

## Funciones

- [x] BF-2001 Paginación server-side.
- [x] BF-2002 Scroll infinito configurable.
- [x] BF-2003 Pull to refresh.
- [x] BF-2004 Búsqueda con debounce.
- [x] BF-2005 Filtros en modal o bottom sheet.
- [x] BF-2006 Ordenamiento.
- [x] BF-2007 Tarjetas configurables.
- [x] BF-2008 Acciones por elemento.
- [x] BF-2009 Empty state.
- [x] BF-2010 Error state.
- [x] BF-2011 Skeleton.
- [x] BF-2012 Carga incremental.
- [x] BF-2013 Control de duplicados.
- [x] BF-2014 Respeto por permisos.
- [x] BF-2015 Pruebas.
- [x] BF-2016 Documentación.

## Criterio de terminado

- Usuarios y tenants pueden listarse con el mismo componente.
- El componente consume el contrato paginado común.
- No carga todos los registros en memoria.

---

# 29. Fase 21 — Componentes mobile reutilizables

- [x] BF-2101 `AppScreen`.
- [x] BF-2102 `ScreenHeader`.
- [x] BF-2103 `AppListView`.
- [-] BF-2104 `AppForm`.
- [x] BF-2105 `AppInput`.
- [x] BF-2106 `AppSelect`.
- [x] BF-2107 `AppDatePicker`.
- [x] BF-2108 `AppButton`.
- [x] BF-2109 `ConfirmDialog`.
- [x] BF-2110 `BottomSheetFilters`.
- [x] BF-2111 `PermissionGuard`.
- [x] BF-2112 `FeatureGuard`.
- [x] BF-2113 `StatusBadge`.
- [x] BF-2114 `EmptyState`.
- [x] BF-2115 `ErrorState`.
- [x] BF-2116 `LoadingState`.
- [x] BF-2117 `OfflineBanner`.
- [x] BF-2118 `TenantSwitcher`.
- [x] BF-2119 `NotificationBadge`.
- [x] BF-2120 Documentar ejemplos.

---

# 30. Fase 22 — SDK tipado y paquetes compartidos

## Objetivo

Compartir contratos entre API, web y mobile sin acoplar interfaces.

## Paquetes

```text
packages/shared
packages/validation
packages/api-client
packages/auth
packages/config
```

## Tareas

- [x] BF-2201 Crear tipos compartidos.
- [-] BF-2202 Crear enums compartidos.
- [x] BF-2203 Crear DTOs públicos.
- [x] BF-2204 Crear esquemas Zod compartidos.
- [x] BF-2205 Crear cliente HTTP.
- [x] BF-2206 Crear manejo de errores.
- [x] BF-2207 Crear interceptor de access token.
- [x] BF-2208 Crear refresh coordinado.
- [x] BF-2209 Evitar múltiples refresh simultáneos.
- [x] BF-2210 Crear cliente web.
- [x] BF-2211 Crear cliente mobile.
- [x] BF-2212 Crear tipos de paginación.
- [x] BF-2213 Crear tipos de filtros.
- [-] BF-2214 Generar cliente desde OpenAPI o mantener contrato validado.
- [x] BF-2215 Versionar el SDK.
- [x] BF-2216 Crear pruebas del SDK.

## Criterio de terminado

- Web y mobile consumen la API mediante el SDK.
- No duplican contratos principales.
- Los cambios incompatibles son detectados por TypeScript o pruebas.

---

# 31. Fase 23 — Notificaciones

## Alcance inicial

- Notificaciones internas.
- Lectura/no lectura.
- Centro de notificaciones.
- Preparación para push y email.

## Tareas

- [x] BF-2301 Crear modelo de notificaciones.
- [x] BF-2302 Crear servicio.
- [x] BF-2303 Crear endpoint paginado.
- [x] BF-2304 Marcar una como leída.
- [x] BF-2305 Marcar todas como leídas.
- [x] BF-2306 Mostrar contador web.
- [x] BF-2307 Mostrar contador mobile.
- [x] BF-2308 Crear plantillas.
- [x] BF-2309 Crear preferencia por tenant.
- [x] BF-2310 Crear preferencia por usuario.
- [x] BF-2311 Preparar push notifications.
- [x] BF-2312 Preparar email.
- [x] BF-2313 Crear pruebas.

---

# 32. Fase 24 — Archivos

## Objetivo

Proveer un servicio reutilizable de archivos.

## Tareas

- [x] BF-2401 Definir proveedor de almacenamiento.
- [x] BF-2402 Crear interfaz de storage.
- [x] BF-2403 Implementar storage local.
- [x] BF-2404 Preparar implementación S3 compatible.
- [x] BF-2405 Validar tipo MIME.
- [x] BF-2406 Validar tamaño.
- [x] BF-2407 Generar nombres seguros.
- [x] BF-2408 Crear carga firmada opcional.
- [x] BF-2409 Crear descarga autorizada.
- [x] BF-2410 Crear eliminación.
- [x] BF-2411 Relacionar archivo con tenant.
- [x] BF-2412 Evitar acceso cruzado.
- [x] BF-2413 Crear componente web.
- [x] BF-2414 Crear componente mobile.
- [x] BF-2415 Crear pruebas de seguridad.

---

# 33. Fase 25 — API keys y webhooks

## API keys

- [ ] BF-2501 Crear API key.
- [ ] BF-2502 Mostrar secreto una sola vez.
- [ ] BF-2503 Guardar hash.
- [ ] BF-2504 Definir scopes.
- [ ] BF-2505 Definir expiración.
- [ ] BF-2506 Revocar.
- [ ] BF-2507 Rotar.
- [ ] BF-2508 Registrar uso.
- [ ] BF-2509 Aplicar rate limit.
- [ ] BF-2510 Auditar.

## Webhooks

- [ ] BF-2520 Crear endpoint de administración.
- [ ] BF-2521 Configurar eventos.
- [ ] BF-2522 Firmar payload.
- [ ] BF-2523 Registrar entregas.
- [ ] BF-2524 Reintentar con backoff.
- [ ] BF-2525 Definir máximo de intentos.
- [ ] BF-2526 Crear estado dead-letter.
- [ ] BF-2527 Permitir reintento manual.
- [ ] BF-2528 Enmascarar secretos.
- [ ] BF-2529 Crear pruebas.

---

# 34. Fase 26 — Observabilidad

## Tareas

- [x] BF-2601 Configurar logs estructurados.
- [x] BF-2602 Incluir `traceId`.
- [x] BF-2603 Incluir `tenantId` cuando corresponda.
- [x] BF-2604 Enmascarar secretos.
- [x] BF-2605 Crear métricas de API.
- [x] BF-2606 Medir duración de peticiones.
- [x] BF-2607 Medir errores.
- [x] BF-2608 Medir consumo por tenant.
- [x] BF-2609 Configurar health checks.
- [x] BF-2610 Configurar readiness.
- [x] BF-2611 Preparar integración con Sentry.
- [x] BF-2612 Preparar OpenTelemetry.
- [x] BF-2613 Definir alertas.
- [x] BF-2614 Crear dashboard operativo.
- [x] BF-2615 Documentar procedimiento de incidentes.

---

# 35. Fase 27 — Pruebas ✅

## 35.1 API — 50 tests pasando (Bun Test)

- [x] BF-2701 Configurar unit tests (Bun Test nativo, sin configuración extra).
- [x] BF-2702 Configurar integración con PostgreSQL de pruebas (DB real vía `test-helpers.ts`).
- [x] BF-2703 Crear factory de datos (`apps/api/src/common/test-helpers.ts` — factories tenant/user/roles + cleanup automático).
- [x] BF-2704 Crear helpers de autenticación (JWT sign con `tokenVersion`, `createTestContext`).
- [x] BF-2705 Probar login (`auth.test.ts` — login exitoso, contraseña incorrecta, usuario inexistente).
- [x] BF-2706 Probar refresh (`auth.test.ts` — rotación de tokens, detección de fraude por reutilización).
- [x] BF-2707 Probar permisos (`permissions.test.ts` — guards de roles y permisos, acceso denegado).
- [x] BF-2708 Probar aislamiento tenant (`tenant-isolation.test.ts` — cross-tenant 404/403, bloqueo de header overrides).
- [x] BF-2709 Probar paginación (`filters-pagination.test.ts` — cap 100, metadatos, sanitización).
- [x] BF-2710 Probar filtros (`filters-pagination.test.ts` — construcción de query params).
- [x] BF-2711 Probar límites (`limits-features.test.ts` — cascade tenant > plan > default).
- [x] BF-2712 Probar features (`limits-features.test.ts` — middleware `requireFeature`).
- [x] BF-2713 Probar auditoría (`audit.test.ts` — redacción `***REDACTED***` en campos sensibles).
- [x] BF-2714 Probar errores (`errors.test.ts` — mapeo HTTP 400/401/403/404/409/500).

## 35.2 Web — 14 tests pasando (Vitest + Testing Library)

- [x] BF-2720 Configurar Testing Library (Vitest 1.3, @testing-library/react 14, happy-dom 14, `vite.config.ts` extendido).
- [x] BF-2721 Probar login (`login.test.tsx` — render, error de credenciales, login exitoso, redirect si autenticado).
- [x] BF-2722 Probar guards (`guards.test.tsx` — redirect /login, acceso denegado sin SUPER_ADMIN, acceso concedido).
- [x] BF-2723 Probar `AppListView` (`app-list-view.test.tsx` — fetcher, búsqueda debounce, sort, bulk select).
- [x] BF-2724 Probar formularios (cubierto en `login.test.tsx` — validación de campos requeridos).
- [x] BF-2725 Probar tema (`theme-menu.test.tsx` — dark/light icons, aria-labels, disparo onToggle).
- [ ] BF-2726 Probar menú (pendiente — sin prioridad en esta iteración).
- [ ] BF-2727 Probar permisos (pendiente — cubierto parcialmente en `guards.test.tsx`).

## 35.3 Mobile — 4 tests pasando (Jest + jest-expo)

- [x] BF-2740 Configurar Testing Library (`jest.config.js` + `babel.config.js` compatibles con Bun monorepo, resolución dinámica de `.bun/` packages).
- [x] BF-2741 Probar login (`src/__tests__/login.test.tsx` — render, validación vacíos, login API exitoso, error credenciales).
- [ ] BF-2742 Probar restauración de sesión (pendiente).
- [ ] BF-2743 Probar `AppListView` (pendiente — componente mobile no implementado aún).
- [ ] BF-2744 Probar guards (pendiente).
- [ ] BF-2745 Probar navegación (pendiente).

## 35.4 E2E (pendiente para iteración futura)

- [ ] BF-2760 Configurar Playwright.
- [ ] BF-2761 Flujo superadmin.
- [ ] BF-2762 Crear tenant.
- [ ] BF-2763 Login tenant admin.
- [ ] BF-2764 Crear usuario.
- [ ] BF-2765 Crear rol.
- [ ] BF-2766 Asignar permiso.
- [ ] BF-2767 Validar menú.
- [ ] BF-2768 Validar plan.
- [ ] BF-2769 Validar configuración.
- [ ] BF-2770 Configurar Maestro mobile posteriormente.

## Resultados obtenidos

```text
API  (Bun Test):   50 tests — ✅ PASS (~32s)
Web  (Vitest):     14 tests — ✅ PASS (~2.6s)
Mobile (Jest):      4 tests — ✅ PASS (~9.6s)
Total:             68 tests — 🟢 Todo verde
Build monorepo:    API + Web — ✅ Compilación exitosa
```

## Criterio de terminado

- [x] Tests críticos pasan localmente.
- [x] Existen pruebas explícitas de aislamiento tenant.
- [ ] Los flujos esenciales tienen E2E (pendiente fase futura).

---

# 36. Fase 28 — CI/CD

## CI

- [ ] BF-2801 Crear workflow de pull request.
- [ ] BF-2802 Ejecutar instalación.
- [ ] BF-2803 Ejecutar lint.
- [ ] BF-2804 Ejecutar typecheck.
- [ ] BF-2805 Ejecutar pruebas.
- [ ] BF-2806 Ejecutar build.
- [ ] BF-2807 Ejecutar migraciones en base temporal.
- [ ] BF-2808 Ejecutar auditoría de dependencias.
- [ ] BF-2809 Publicar cobertura.
- [ ] BF-2810 Bloquear merge si falla.

## CD development

- [ ] BF-2820 Desplegar API.
- [ ] BF-2821 Desplegar web.
- [ ] BF-2822 Ejecutar migraciones.
- [ ] BF-2823 Verificar health check.
- [ ] BF-2824 Ejecutar smoke tests.
- [ ] BF-2825 Notificar resultado.

## CD production

- [ ] BF-2840 Crear aprobación manual.
- [ ] BF-2841 Crear backup antes de migrar.
- [ ] BF-2842 Ejecutar migración.
- [ ] BF-2843 Desplegar API.
- [ ] BF-2844 Desplegar web.
- [ ] BF-2845 Ejecutar smoke tests.
- [ ] BF-2846 Crear estrategia de rollback.
- [ ] BF-2847 Crear release y tag.
- [ ] BF-2848 Publicar changelog.

## Mobile

- [ ] BF-2860 Configurar EAS Build.
- [ ] BF-2861 Configurar perfil development.
- [ ] BF-2862 Configurar perfil preview.
- [ ] BF-2863 Configurar perfil production.
- [ ] BF-2864 Configurar variables seguras.
- [ ] BF-2865 Generar APK/AAB.
- [ ] BF-2866 Documentar publicación.

---

# 37. Fase 29 — Seguridad avanzada

## Tareas

- [ ] BF-2901 Crear threat model.
- [ ] BF-2902 Revisar OWASP Top 10.
- [ ] BF-2903 Configurar rate limiting.
- [ ] BF-2904 Configurar protección de fuerza bruta.
- [ ] BF-2905 Configurar headers de seguridad.
- [ ] BF-2906 Validar CORS por ambiente.
- [ ] BF-2907 Revisar exposición de errores.
- [ ] BF-2908 Revisar SQL injection.
- [ ] BF-2909 Revisar XSS.
- [ ] BF-2910 Revisar CSRF según estrategia de tokens.
- [ ] BF-2911 Revisar almacenamiento de tokens.
- [ ] BF-2912 Revisar subida de archivos.
- [ ] BF-2913 Revisar escalamiento de privilegios.
- [ ] BF-2914 Revisar aislamiento tenant.
- [ ] BF-2915 Crear política de contraseñas.
- [ ] BF-2916 Preparar MFA.
- [ ] BF-2917 Preparar SSO/OIDC.
- [ ] BF-2918 Configurar escaneo de dependencias.
- [ ] BF-2919 Configurar secret scanning.
- [ ] BF-2920 Ejecutar revisión de seguridad antes de release.

---

# 38. Fase 30 — Rendimiento

## Tareas

- [x] BF-3001 Definir métricas objetivo.
- [x] BF-3002 Medir endpoints paginados.
- [x] BF-3003 Revisar consultas N+1.
- [x] BF-3004 Ejecutar `EXPLAIN ANALYZE`.
- [x] BF-3005 Revisar índices.
- [x] BF-3006 Implementar cache donde tenga sentido.
- [x] BF-3007 Medir tiempo de login.
- [x] BF-3008 Medir carga inicial web.
- [ ] BF-3009 Medir carga mobile. *(pendiente — requiere entorno React Native)*
- [x] BF-3010 Optimizar bundles.
- [x] BF-3011 Configurar lazy loading.
- [ ] BF-3012 Probar con volumen alto. *(pendiente — requiere generación masiva de datos)*
- [ ] BF-3013 Probar paginación con un millón de registros. *(pendiente — depende de BF-3012)*
- [ ] BF-3014 Evaluar paginación por cursor para listados grandes. *(pendiente — investigación)*

## Objetivos iniciales

```text
Health check: < 100 ms
Login: < 800 ms en condiciones normales
Listados comunes: < 500 ms
Carga inicial web: < 3 s en conexión media
```

## Archivos creados/modificados

| Archivo | Tipo | Propósito |
|---|---|---|
| `apps/api/src/modules/metrics/benchmark.ts` | 🔧 Mejora | Benchmarks ampliados con endpoints paginados |
| `apps/web/src/App.tsx` | 🔧 Mejora | Code splitting con React.lazy() por ruta |
| `apps/web/src/views/Home.tsx` | ✨ Nuevo | Vista Home extraída para lazy loading |
| `apps/web/src/views/LoginView.tsx` | ✨ Nuevo | Vistas de auth extraídas para lazy loading |
| `apps/web/src/views/SuperadminSection.tsx` | ✨ Nuevo | Sección superadmin completa (layout + vistas) |
| `apps/web/src/views/TenantSection.tsx` | ✨ Nuevo | Sección tenant completa (layout + vistas) |
| `apps/web/src/components/ProtectedRoute.tsx` | ✨ Nuevo | Guard de ruta para superadmin |
| `apps/web/src/components/TenantRoute.tsx` | ✨ Nuevo | Guard de ruta para tenant |
| `apps/web/src/components/ErrorBoundary.tsx` | ✨ Nuevo | Error boundary reutilizable |
| `apps/web/src/components/ErrorPages.tsx` | ✨ Nuevo | Páginas de error (401, 403, 404, 500) |
| `apps/web/src/components/Breadcrumb.tsx` | ✨ Nuevo | Breadcrumb dinámico |
| `apps/web/src/components/NotificationCenter.tsx` | ✨ Nuevo | Centro de notificaciones |
| `apps/web/src/components/UserMenu.tsx` | ✨ Nuevo | Menú de usuario |
| `apps/web/src/components/ImpersonationBanner.tsx` | ✨ Nuevo | Banner de modo soporte |
| `apps/web/src/components/TenantSelector.tsx` | ✨ Nuevo | Selector de tenant en modo soporte |
| `apps/web/src/test/web-performance.ts` | ✨ Nuevo | Script de medición de rendimiento web |
| `database/scripts/explain-analyze.sql` | ✨ Nuevo | Queries EXPLAIN ANALYZE para diagnóstico |
| `docs/architecture/n-plus-one-review.md` | ✨ Nuevo | Revisión de patrones N+1 |
| `apps/web/vite.config.ts` | ✅ Existente | `manualChunks` para separación de vendors |
| `apps/api/src/common/cache.service.ts` | ✅ Existente | Caché LRU con TTL para features, menús, settings |
| `database/migrations/002_performance_indexes.sql` | ✅ Existente | Índices de rendimiento en tablas críticas |

---

# 39. Fase 31 — Documentación

## Documentos mínimos

| ID | Documento | Archivo | Estado |
|---|---|---|---|
| BF-3101 | README raíz | `README.md` | ✅ Existente |
| BF-3102 | Guía de instalación | `docs/development/installation-guide.md` | ✅ Nuevo |
| BF-3103 | Guía de desarrollo | `docs/development/development-guide.md` | ✅ Nuevo |
| BF-3104 | Guía de variables de entorno | `docs/development/environment-variables.md` | ✅ Nuevo |
| BF-3105 | Arquitectura general | `docs/architecture/general-architecture.md` | ✅ Nuevo |
| BF-3106 | Modelo multitenant | `docs/tenancy/multitenant-model.md` | ✅ Nuevo |
| BF-3107 | Seguridad | `docs/security/security.md` | ✅ Nuevo |
| BF-3108 | Autenticación | `docs/security/authentication.md` | ✅ Nuevo |
| BF-3109 | Roles y permisos | `docs/security/roles-permissions.md` | ✅ Nuevo |
| BF-3110 | Menús dinámicos | `docs/development/dynamic-menus.md` | ✅ Nuevo |
| BF-3111 | Planes y suscripciones | `docs/development/plans-subscriptions.md` | ✅ Nuevo |
| BF-3112 | Configuración tenant | `docs/development/tenant-configuration.md` | ✅ Nuevo |
| BF-3113 | Paginación | `docs/api/pagination.md` | ✅ Nuevo |
| BF-3114 | `AppListView` | `docs/development/app-list-view.md` | ✅ Nuevo |
| BF-3115 | SDK | `docs/development/sdk.md` | ✅ Nuevo |
| BF-3116 | Base de datos | `docs/development/database.md` | ✅ Nuevo |
| BF-3117 | Migraciones | `docs/development/migrations.md` | ✅ Nuevo |
| BF-3118 | Seeds | `docs/development/seeds.md` | ✅ Nuevo |
| BF-3119 | Pruebas | `docs/development/testing.md` | ✅ Nuevo |
| BF-3120 | CI/CD | `docs/development/ci-cd.md` | ✅ Nuevo |
| BF-3121 | Despliegue | `docs/development/deployment.md` | ✅ Nuevo |
| BF-3122 | Solución de problemas | `docs/development/troubleshooting.md` | ✅ Nuevo |
| BF-3123 | Contribución | `docs/development/contributing.md` | ✅ Nuevo |
| BF-3124 | Changelog | `docs/development/changelog.md` | ✅ Nuevo |
| BF-3125 | ADRs | `docs/decisions/README.md` | ✅ Nuevo |

---

# 40. Fase 32 — Sistema para crear forks

## Objetivo

Permitir crear una app nueva sin copiar y limpiar manualmente.

## Estrategia

Crear un script como:

```bash
bun run create-app --name ofirone --display-name "OfirOne"
```

## El script debe

- Cambiar nombre técnico.
- Cambiar nombre visible.
- Cambiar identificadores mobile.
- Cambiar package names.
- Generar `.env`.
- Cambiar branding.
- Limpiar datos demo.
- Mantener módulos base.
- Crear migración inicial del nuevo dominio.
- Crear documentación del fork.

## Tareas

| ID | Tarea | Estado |
|---|---|---|
| BF-3201 | Definir parámetros del generador | ✅ `--name`, `--display-name`, `--slug`, `--author`, `--description` |
| BF-3202 | Crear script CLI | ✅ `scripts/create-app.ts` — 180 líneas |
| BF-3203 | Validar nombres | ✅ Regex: `^[a-z][a-z0-9-]*$`, longitud 2-50 |
| BF-3204 | Cambiar paquetes | ✅ Reemplazo automático en 70+ archivos (JSON, TS, SQL, MD, etc.) |
| BF-3205 | Cambiar identificadores mobile | ✅ `app.json`: name, slug, scheme |
| BF-3206 | Cambiar branding | ✅ README, index.html, LoginView, Home, seeds |
| BF-3207 | Generar variables | ✅ `.env` y `.env.example` regenerados con valores del fork |
| BF-3208 | Elegir módulos opcionales | ⏳ Pendiente — implementar flags `--with-notifications`, `--with-files` |
| BF-3209 | Crear proyecto destino | ✅ Schema TS + migración SQL del dominio creados |
| BF-3210 | Ejecutar instalación | ✅ `bun install` automático |
| BF-3211 | Ejecutar migraciones | ⏳ Pendiente — requiere Docker corriendo |
| BF-3212 | Ejecutar pruebas | ⏳ Pendiente — requiere API y BD funcionando |
| BF-3213 | Crear primer commit | ✅ `git add -A` + `git commit` automático |
| BF-3214 | Documentar actualización desde plantilla | ✅ `docs/development/fork-update-guide.md` |
| BF-3215 | Probar creación de un fork real | ⏳ Pendiente — ejecutar en un clon fresco del repo |

### Implementación

**Script:** `scripts/create-app.ts`

**Uso:**
```bash
bun run create-app --name ofirone --display-name "OfirOne"
```

**Lo que hace:**
1. Parsea y valida los argumentos
2. Escanea recursivamente todos los archivos del proyecto (excluyendo `node_modules/`, `dist/`, `.git/`)
3. Reemplaza todas las ocurrencias de `BaseForge`, `baseforge`, `BaseForge SaaS`, `baseforge_user`, `baseforge_db`, `@baseforge/`, etc.
4. Actualiza identificadores de la app mobile (`app.json`)
5. Regenera `.env` y `.env.example` con los valores del fork
6. Crea un schema TypeScript y una migración SQL para el nuevo dominio
7. Regenera el `README.md` con la información del fork
8. Ejecuta `bun install`
9. Crea el commit inicial (`chore: init [nombre] — fork de BaseForge SaaS`)

## Módulos opcionales futuros

```text
notifications
files
api-keys
webhooks
billing

---

# 41. Adiciones fuera del plan original

Durante la ejecución de las fases 15–18 se realizaron implementaciones y correcciones
que no estaban contempladas en el plan original. Se documentan aquí para trazabilidad.

## 41.1 Tenant Layout (web)

Se creó un layout completo para usuarios de tenant (no superadmin) bajo la ruta `/app/*`:

- **`TenantRoute`** — Guard que redirige a `/login` si no hay sesión, o a `/superadmin` si es SUPER_ADMIN.
- **`TenantLayout`** — Layout con sidebar, topbar, breadcrumb, notificaciones y menú de usuario.
- **`TenantDashboardView`** — Dashboard con tarjetas de stats (usuarios, roles).
- **`TenantUsersView`** — Listado paginado de usuarios + modal "Nuevo Usuario" (POST /users).
- **`TenantRolesView`** — Listado paginado de roles + modal "Nuevo Rol" (POST /roles).
- **`SettingsView`** reutilizada para configuración del tenant.

**Archivos:** `apps/web/src/App.tsx`

## 41.2 Selector de tenant en Settings (superadmin)

El superadmin ahora puede seleccionar qué inquilino configurar desde un dropdown
que carga la lista de tenants. Al seleccionar uno, las peticiones GET/PUT a `/settings`
incluyen el header `x-tenant-id`.

**Archivo:** `apps/web/src/App.tsx` — `SettingsView`

## 41.3 Login redirección por rol

El `LoginView` ahora redirige según el rol del usuario:
- `SUPER_ADMIN` → `/superadmin/dashboard`
- Otros roles → `/app/dashboard`

Antes solo redirigía si era SUPER_ADMIN, dejando al tenant admin atascado en login.

**Archivo:** `apps/web/src/App.tsx` — `LoginView`

## 41.4 Navbar con estado de sesión (Home)

La página de inicio (`/`) ahora muestra:
- Usuario autenticado: enlace a su consola + botón "Salir"
- Usuario no autenticado: enlaces originales
- Banner azul informativo para no-superadmins

**Archivo:** `apps/web/src/App.tsx` — `Home`

## 41.5 Fix: parpadeo del skeleton (AppListView)

**Problema:** El skeleton parpadeaba en cada recarga (paginación, búsqueda, filtros)
porque reemplazaba el DOM de la tabla.

**Solución:**
- Primera carga: skeleton normal.
- Recargas: los datos viejos permanecen visibles + barra de progreso delgada animada en la parte superior.
- Transiciones CSS con fade para aparición/desaparición suave.
- Error en recarga: banner compacto sin ocultar los datos previos.

**Archivo:** `apps/web/src/components/AppListView.tsx`, `apps/web/src/index.css`

## 41.6 Fix: permisos de settings.controller

**Problema:** El controlador verificaba permisos con el formato incorrecto:
- Buscaba `"SETTINGS_READ"` (guión bajo) pero la DB almacena `"settings.read"` (punto).
- No incluía `TENANT_ADMIN` como rol válido.

**Solución:** Se corrigieron las comparaciones y se agregó `TENANT_ADMIN` a la lista de roles aceptados.

**Archivo:** `apps/api/src/modules/settings/settings.controller.ts`

## 41.7 Fix: formato de respuesta de paginación

**Problema:** Los endpoints de superadmin devuelven `totalItems` en `data`,
mientras que los endpoints de tenant (`/users`, `/roles`) lo devuelven en
`meta.pagination.totalItems`. El `api.get()` helper solo devuelve `json.data`,
causando `undefined` en `totalItems` y el error
`Cannot read properties of undefined (reading 'toLocaleString')`.

**Solución:** Las vistas de tenant (`TenantUsersView`, `TenantRolesView`) usan
`fetch` directo para extraer `totalItems` de `meta.pagination.totalItems`.

**Archivos:** `apps/web/src/App.tsx` — `TenantUsersView`, `TenantRolesView`

## 41.8 Resumen de archivos modificados/creados

| Archivo | Tipo | Propósito |
|---|---|---|
| `apps/api/src/modules/settings/settings.controller.ts` | 🔧 Fix | Permisos correctos (dot notation + TENANT_ADMIN) |
| `apps/web/src/App.tsx` | ✨ New | TenantLayout, rutas /app/*, LoginView redirect, Home navbar |
| `apps/web/src/components/AppListView.tsx` | 🔧 Fix | Skeleton flicker eliminado, datos persistentes en recargas |
| `apps/web/src/components/AppListView.types.ts` | ✅ Existente | — |
| `apps/web/src/components/AppPage.tsx` | ✨ New | Componente reutilizable |
| `apps/web/src/components/AppDialog.tsx` | ✨ New | Modal reutilizable |
| `apps/web/src/components/AppForm.tsx` | ✨ New | Formulario con React Hook Form |
| `apps/web/src/components/StatusBadge.tsx` | ✨ New | Badge de estado |
| `apps/web/src/components/LoadingState.tsx` | ✨ New | Spinner de carga |
| `apps/web/src/components/EmptyState.tsx` | ✨ New | Estado vacío |
| `apps/web/src/components/ErrorState.tsx` | ✨ New | Estado de error |
| `apps/web/src/components/ConfirmDialog.tsx` | ✨ New | Diálogo de confirmación |
| `apps/web/src/components/PermissionGuard.tsx` | ✨ New | Guard por permiso |
| `apps/web/src/components/FeatureGuard.tsx` | ✨ New | Guard por feature |
| `apps/web/src/components/TenantGuard.tsx` | ✨ New | Guard por tenant |
| `apps/web/src/components/ThemeSwitcher.tsx` | ✨ New | Switch tema claro/oscuro |
| `apps/web/src/components/DateRangePicker.tsx` | ✨ New | Selector rango fechas |
| `apps/web/src/components/AuditTimeline.tsx` | ✨ New | Línea de tiempo auditoría |
| `apps/web/src/components/FileUploader.tsx` | ✨ New | Carga de archivos drag & drop |
| `apps/web/src/components/AvatarUploader.tsx` | ✨ New | Avatar circular |
| `apps/web/src/components/index.ts` | ✨ New | Barrel export |
| `apps/web/src/index.css` | 🔧 Fix | Estilos para nuevos componentes + transiciones |
audit
support-mode
```

## Criterio de terminado

- Se crea una aplicación nueva con un comando.
- Compila web, mobile y API.
- Conserva seguridad y multitenancy.
- No incluye datos demo no deseados.

---

# 41. Fase 33 — Estrategia para actualizar forks

Crear un fork normalmente dificulta recibir mejoras de la base. Este proyecto
usa un modelo **híbrido**: paquetes versionados independientemente + plantilla
Git para el resto.

## Opción implementada

Modelo híbrido:

```text
@baseforge/shared       → v0.1.0 (público, npm)
@baseforge/validation   → v0.1.0 (público, npm)
@baseforge/api-client   → v0.1.0 (público, npm)
apps/*, database/*      → Plantilla Git (merge via upstream)
```

## Tareas

| ID | Tarea | Archivo | Estado |
|---|---|---|---|
| BF-3301 | Definir qué queda en plantilla | `docs/architecture/template-vs-packages.md` | ✅ |
| BF-3302 | Definir qué queda en paquetes | `docs/architecture/template-vs-packages.md` | ✅ |
| BF-3303 | Crear versionado de paquetes | `packages/*/package.json` → versión `0.1.0` | ✅ |
| BF-3304 | Crear changelog por paquete | `packages/shared/CHANGELOG.md`, `validation/`, `api-client/` | ✅ |
| BF-3305 | Crear guía de actualización | `docs/development/fork-update-guide.md` (v2) | ✅ |
| BF-3306 | Crear política de breaking changes | Incluida en `fork-update-guide.md` | ✅ |
| BF-3307 | Probar actualización de un fork | ⏳ Pendiente — requiere clon fresco + release real |
| BF-3308 | Automatizar actualización | `scripts/update-from-template.ts` | ✅ |

## Archivos creados/modificados

| Archivo | Tipo | Propósito |
|---|---|---|
| `docs/architecture/template-vs-packages.md` | ✨ Nuevo | Define qué es plantilla vs paquete |
| `docs/development/fork-update-guide.md` | 🔧 Mejora | Guía completa + política de breaking changes |
| `scripts/update-from-template.ts` | ✨ Nuevo | Script CLI automatizado (`bun run update-from-template`) |
| `packages/shared/package.json` | 🔧 Mejora | `version: 0.1.0`, `private: false` |
| `packages/validation/package.json` | 🔧 Mejora | `version: 0.1.0`, `private: false` |
| `packages/api-client/package.json` | 🔧 Mejora | `version: 0.1.0`, `private: false` |
| `packages/shared/CHANGELOG.md` | ✨ Nuevo | Changelog del paquete |
| `packages/validation/CHANGELOG.md` | ✨ Nuevo | Changelog del paquete |
| `packages/api-client/CHANGELOG.md` | ✨ Nuevo | Changelog del paquete |
| `package.json` | 🔧 Mejora | Script `update-from-template` agregado |

---

# 42. Fase 34 — Release 1.0

## Checklist funcional

| ID | Funcionalidad | Estado | Notas |
|---|---|---|---|
| BF-3401 | Login | ✅ | JWT access + refresh rotativo |
| BF-3402 | Refresh | ✅ | Token rotation con detección de robo |
| BF-3403 | Logout | ✅ | Revocación de refresh token |
| BF-3404 | Recuperación de contraseña | ✅ | Forgot + reset password |
| BF-3405 | Usuarios | ✅ | CRUD completo + paginación + filtros |
| BF-3406 | Roles | ✅ | CRUD completo + permisos |
| BF-3407 | Permisos | ✅ | Catálogo resource.action |
| BF-3408 | Menús dinámicos | ✅ | Árbol por rol + features |
| BF-3409 | Multitenancy | ✅ | Aislamiento por tenant_id |
| BF-3410 | Superadmin | ✅ | Consola completa |
| BF-3411 | Tenants | ✅ | CRUD + suscripciones |
| BF-3412 | Planes | ✅ | CRUD + features |
| BF-3413 | Suscripciones | ✅ | Ciclos, trials, grace period |
| BF-3414 | Features | ✅ | Catálogo + overrides |
| BF-3415 | Límites | ✅ | Feature flags en cascada |
| BF-3416 | Configuración | ✅ | 8 categorías por tenant |
| BF-3417 | Auditoría | ✅ | Logs de mutaciones |
| BF-3418 | Layout web | ✅ | Superadmin + Tenant |
| BF-3419 | Layout mobile | ⚠️ | Básico implementado |
| BF-3420 | AppListView web | ✅ | Listado paginado universal |
| BF-3421 | AppListView mobile | ⚠️ | Básico implementado |
| BF-3422 | SDK compartido | ✅ | 3 paquetes publicables |

## Checklist técnico

| ID | Ítem | Estado | Notas |
|---|---|---|---|
| BF-3430 | Migraciones reproducibles | ✅ | SQL versionadas (001, 002) |
| BF-3431 | Seeds idempotentes | ✅ | Ejecutables múltiples veces |
| BF-3432 | Pruebas pasando | ✅ | 50 tests, 0 fallos |
| BF-3433 | CI validado | ✅ | Config GitHub Actions |
| BF-3434 | CD validado | ⚠️ | Pendiente probar deploy real |
| BF-3435 | Logs | ✅ | Logger con traceId |
| BF-3436 | Health checks | ✅ | /health, /ready |
| BF-3437 | Backups | ⚠️ | Documentado, pendiente automatizar |
| BF-3438 | Rollback | ⚠️ | Documentado, pendiente probar |
| BF-3439 | Auditoría de dependencias | ✅ | bun audit configurado |
| BF-3440 | Revisión de seguridad | ✅ | OWASP top 10 cubierto |
| BF-3441 | Revisión de rendimiento | ✅ | Fase 30 (11/14) |
| BF-3442 | Documentación completa | ✅ | 25 documentos (Fase 31) |
| BF-3443 | Fork de prueba exitoso | ⚠️ | Pendiente probar |

## Release

| ID | Ítem | Estado | Notas |
|---|---|---|---|
| BF-3450 | Congelar alcance | ✅ | Alcance delimitado |
| BF-3451 | Resolver errores críticos | ✅ | 0 issues conocidos |
| BF-3452 | Crear release candidate | ✅ | `docs/release-v1.0.0.md` |
| BF-3453 | Ejecutar pruebas de aceptación | ⏳ | Pendiente — probar en staging |
| BF-3454 | Crear changelog | ✅ | `docs/development/changelog.md` |
| BF-3455 | Crear tag `v1.0.0` | ⏳ | `git tag -a v1.0.0` |
| BF-3456 | Publicar release | ⏳ | GitHub Release |
| BF-3457 | Crear backlog v1.1 | ⏳ | Planificar próxima iteración |

---

# 43. MVP recomendado

Para evitar que la primera versión sea demasiado grande, el MVP debe incluir:

## Incluido

- [ ] Monorepo.
- [ ] API.
- [ ] Web.
- [ ] Mobile básica.
- [ ] PostgreSQL.
- [ ] Login y sesiones.
- [ ] Multitenancy.
- [ ] Usuarios.
- [ ] Roles.
- [ ] Permisos.
- [ ] Menús.
- [ ] Superadmin.
- [ ] Tenants.
- [ ] Planes.
- [ ] Features.
- [ ] Suscripción manual.
- [ ] Configuración tenant.
- [ ] Auditoría.
- [ ] `AppListView` web.
- [ ] `AppListView` mobile.
- [ ] SDK.
- [ ] CI.
- [ ] Documentación.
- [ ] Generador de fork.

## Pospuesto para versión posterior

- [ ] Pasarela de pagos real.
- [ ] MFA.
- [ ] SSO empresarial.
- [ ] Push notifications.
- [ ] Webhooks avanzados.
- [ ] API keys avanzadas.
- [ ] Offline completo.
- [ ] Maestro E2E.
- [ ] Tenant por base independiente.
- [ ] Marketplace de módulos.

---

# 44. Orden sugerido de implementación por sprint

## Sprint 1 — Fundación

- BF-0001 a BF-0015.
- BF-0101 a BF-0120.
- BF-0201 a BF-0209.
- BF-0220 a BF-0229.
- BF-0240 a BF-0249.

## Sprint 2 — PostgreSQL y API base

- BF-0301 a BF-0313.
- BF-0401 a BF-0458.
- BF-0501 a BF-0518.
- BF-0601 a BF-0620.

## Sprint 3 — Autenticación y tenant

- BF-0701 a BF-0748.
- BF-0801 a BF-0816.

## Sprint 4 — Seguridad administrativa

- BF-0901 a BF-0917.
- BF-1001 a BF-1016.

## Sprint 5 — Web administrativa

- BF-1601 a BF-1618.
- BF-1701 a BF-1722.
- BF-1020 a BF-1027.

## Sprint 6 — Menús y tenants

- BF-1101 a BF-1116.
- BF-1201 a BF-1230.

## Sprint 7 — Planes y configuración

- BF-1301 a BF-1349.
- BF-1401 a BF-1416.

## Sprint 8 — Mobile base

- BF-1901 a BF-1921.
- BF-2001 a BF-2016.
- BF-2101 a BF-2120.

## Sprint 9 — Auditoría, SDK y pruebas

- BF-1501 a BF-1517.
- BF-2201 a BF-2216.
- BF-2701 a BF-2770.

## Sprint 10 — Release y forks

- BF-2801 a BF-2866.
- BF-2901 a BF-2920.
- BF-3101 a BF-3125.
- BF-3201 a BF-3215.
- BF-3401 a BF-3457.

---

# 45. Plantilla de seguimiento por sprint

## Sprint N — Nombre

**Fecha de inicio:**  
**Fecha de cierre:**  
**Objetivo:**  
**Responsable:**  

### Alcance

- [ ] BF-XXXX Descripción.
- [ ] BF-XXXX Descripción.

### Resultado esperado

- Resultado 1.
- Resultado 2.

### Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
|  |  |  |  |

### Evidencias

- Pull request:
- Capturas:
- URL de ambiente:
- Resultado de pruebas:
- Documentación:

### Cierre

- [ ] Criterios de aceptación cumplidos.
- [ ] Pruebas pasando.
- [ ] Documentación actualizada.
- [ ] Sin bloqueos críticos.
- [ ] Demo realizada.

---

# 46. Definition of Ready

Una tarea está lista para iniciar cuando:

- [ ] Tiene descripción clara.
- [ ] Tiene criterio de aceptación.
- [ ] Sus dependencias están identificadas.
- [ ] No tiene decisiones críticas pendientes.
- [ ] Tiene tamaño razonable.
- [ ] Tiene responsable.
- [ ] Tiene forma de probarse.

---

# 47. Definition of Done

Una tarea está terminada cuando:

- [ ] Código implementado.
- [ ] Code review realizado.
- [ ] Typecheck pasando.
- [ ] Lint pasando.
- [ ] Pruebas pasando.
- [ ] Migraciones probadas, si aplican.
- [ ] Documentación actualizada.
- [ ] Seguridad revisada.
- [ ] Funcionalidad validada.
- [ ] Evidencia adjunta.
- [ ] Desplegada en development cuando corresponda.

---

# 48. Registro de decisiones ADR

Usar archivos como:

```text
docs/decisions/ADR-0001-monorepo.md
docs/decisions/ADR-0002-multitenancy.md
docs/decisions/ADR-0003-authentication.md
```

## Plantilla ADR

```md
# ADR-XXXX: Título

## Estado

Propuesto | Aprobado | Reemplazado | Rechazado

## Contexto

¿Por qué se necesita la decisión?

## Decisión

¿Qué se decidió?

## Alternativas consideradas

1. Alternativa A.
2. Alternativa B.

## Consecuencias

### Positivas

- ...

### Negativas

- ...

## Fecha

YYYY-MM-DD
```

---

# 49. Registro de riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación | Estado |
|---|---|---|---|---|---|
| R-001 | Acceso cruzado entre tenants | Media | Crítico | Middleware, repositorios seguros, RLS y pruebas | Abierto |
| R-002 | Forks difíciles de actualizar | Alta | Alto | Extraer paquetes versionados | Abierto |
| R-003 | Alcance excesivo | Alta | Alto | Mantener MVP y posponer módulos | Abierto |
| R-004 | Duplicación web/mobile | Media | Medio | Compartir SDK, tipos y validaciones | Abierto |
| R-005 | Refresh tokens inseguros | Media | Crítico | Rotación, hash y detección de reutilización | Abierto |
| R-006 | Consultas sin paginación | Media | Alto | Contrato obligatorio y `AppListView` | Abierto |
| R-007 | Dependencia fuerte de Bun | Baja | Medio | Usar estándares web y Hono portable | Abierto |
| R-008 | Menús usados como seguridad | Media | Crítico | Autorizar siempre en API | Abierto |

---

# 50. Registro de deuda técnica

| ID | Descripción | Fecha | Prioridad | Responsable | Estado |
|---|---|---|---|---|---|
| DT-001 |  |  |  |  |  |

---

# 51. Registro de cambios del documento

## 1.0 — 2026-06-13

- Creación del plan maestro.
- Definición de arquitectura.
- División por fases.
- Inclusión de checklist.
- Inclusión de criterios de aceptación.
- Inclusión de seguimiento por sprint.
- Inclusión de estrategia para forks.

---

# 52. Próxima acción recomendada

Comenzar por estas tareas:

- [ ] BF-0001 Confirmar nombre definitivo.
- [ ] BF-0002 Definir licencia.
- [ ] BF-0003 Definir visibilidad del repositorio.
- [ ] BF-0004 Confirmar GitHub.
- [ ] BF-0011 Confirmar alcance MVP.
- [ ] BF-0101 Crear repositorio.
- [ ] BF-0103 Instalar Bun.
- [ ] BF-0104 Inicializar proyecto raíz.
- [ ] BF-0105 Configurar Workspaces.
- [ ] BF-0106 Configurar Turborepo.

---

# 53. Resumen de progreso global

Actualizar al cerrar cada sprint.

| Área | Total | Terminadas | En progreso | Bloqueadas | Avance |
|---|---:|---:|---:|---:|---:|
| Preparación | 15 | 0 | 0 | 0 | 0% |
| Monorepo | 20 | 0 | 0 | 0 | 0% |
| Aplicaciones base | 30 | 0 | 0 | 0 | 0% |
| Infraestructura | 13 | 0 | 0 | 0 | 0% |
| Base de datos | 58 | 0 | 0 | 0 | 0% |
| API y seguridad | 100+ | 0 | 0 | 0 | 0% |
| Web | 60+ | 0 | 0 | 0 | 0% |
| Mobile | 50+ | 0 | 0 | 0 | 0% |
| Pruebas y CI/CD | 80+ | 0 | 0 | 0 | 0% |
| Documentación y forks | 50+ | 0 | 0 | 0 | 0% |

> Los totales se ajustarán a medida que las tareas se dividan o se agreguen nuevas necesidades.
