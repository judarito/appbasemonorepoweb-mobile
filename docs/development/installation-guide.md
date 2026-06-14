# Guía de Instalación — BaseForge SaaS

> **BF-3102** — Versión 1.0 — 2026-06-14

---

## Requisitos previos

| Herramienta | Versión mínima | Propósito |
|---|---|---|
| [Bun](https://bun.sh) | 1.1.x | Runtime y package manager |
| [Docker](https://docker.com) | 24+ | PostgreSQL local |
| [Docker Compose](https://docs.docker.com/compose/) | v2+ | Orquestación local |
| [Git](https://git-scm.com) | 2.40+ | Control de versiones |

Opcionales:

| Herramienta | Propósito |
|---|---|
| [PgAdmin](https://www.pgadmin.org) | Interfaz gráfica PostgreSQL |
| [psql](https://www.postgresql.org/docs/current/app-psql.html) | CLI de PostgreSQL |
| [React Native Expo Go](https://expo.dev) | Desarrollo mobile en físico |

---

## 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd baseforge
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores correspondientes (ver [Guía de variables de entorno](./environment-variables.md)).

## 3. Iniciar base de datos local

```bash
docker compose up -d
```

Esto levanta PostgreSQL en `localhost:5432`.

## 4. Instalar dependencias

```bash
bun install
```

## 5. Ejecutar migraciones

```bash
bun run db:migrate
```

## 6. Sembrar datos iniciales

```bash
bun run db:seed
```

Esto crea:
- Superadmin por defecto: `superadmin@baseforge.local` / `SuperAdmin123!`
- Tenants de demostración
- Planes, roles y permisos base

## 7. Iniciar el proyecto

```bash
# Todo el monorepo (API + Web)
bun run dev

# Solo la API
cd apps/api && bun run dev

# Solo la web
cd apps/web && bun run dev

# Solo mobile
cd apps/mobile && bun run dev
```

## 8. Verificar instalación

```bash
# Health check de la API
curl http://localhost:3000/health

# Documentación Swagger
open http://localhost:3000/docs
```

---

## Solución de problemas comunes

| Problema | Solución |
|---|---|
| `bun install` falla | Verificar que Bun esté instalado: `bun --version` |
| Puerto 5432 ocupado | Cambiar `DB_PORT` en `.env` y `docker-compose.yml` |
| Migraciones fallan | Ejecutar `bun run db:reset` para reiniciar la BD |
| API no responde | Verificar `docker ps` y que PostgreSQL esté corriendo |

---

## Siguientes pasos

- [Guía de desarrollo](./development-guide.md)
- [Guía de variables de entorno](./environment-variables.md)
- [Arquitectura general](../architecture/general-architecture.md)
