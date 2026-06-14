# BaseForge SaaS

BaseForge es un monorepo modular diseñado como una plantilla SaaS multitenant reutilizable y extensible.

## Estructura del Proyecto

El monorepo está organizado de la siguiente manera:

```text
├── apps/
│   ├── api/          # Servidor HTTP con Bun + Hono
│   ├── web/          # Frontend Web con React + Vite + TypeScript
│   └── mobile/       # Aplicación Móvil con React Native + Expo
├── packages/
│   ├── api-client/   # Cliente HTTP y SDK autogenerado o compartido
│   ├── auth/         # Utilidades y configuración de Autenticación/JWT
│   ├── config/       # Ajustes comunes del proyecto
│   ├── eslint-config/# Configuración compartida de ESLint
│   ├── shared/       # Tipos, utilidades y helpers comunes
│   ├── tsconfig/     # Configuraciones base de TypeScript
│   ├── ui-web/       # Componentes visuales web comunes
│   ├── ui-mobile/    # Componentes visuales móviles comunes
│   └── validation/   # Esquemas de validación Zod compartidos
├── database/
│   ├── migrations/   # Migraciones de esquema PostgreSQL (Drizzle)
│   ├── seeds/        # Semillas de desarrollo y producción
│   └── scripts/      # Scripts de base de datos
├── docs/             # Documentación técnica general
├── infrastructure/   # Archivos de Docker, Compose y CI/CD
└── scripts/          # Utilidades globales de ejecución
```

## Requisitos Previos

- [Bun](https://bun.sh) (v1.x+)
- [Node.js](https://nodejs.org) (v22+)
- [Docker & Docker Compose](https://www.docker.com) (Para base de datos local)

## Comandos Disponibles

Desde el directorio raíz:

- **Instalar dependencias**: `bun install`
- **Iniciar en modo desarrollo**: `bun run dev` (ejecuta todas las aplicaciones en paralelo mediante Turborepo)
- **Compilar todos los proyectos**: `bun run build`
- **Linter de código**: `bun run lint`
- **Verificación de tipos**: `bun run typecheck`
- **Ejecutar pruebas**: `bun run test`
- **Limpiar temporales y dependencias**: `bun run clean`

## Creación de Forks

Para crear un nuevo proyecto a partir de esta plantilla, consulta la [Guía de Creación de Forks](docs/development/fork-creation-guide.md).

El comando principal (ejecutado en una copia limpia del repositorio) es:

```bash
bun run create-app --name mi-proyecto --display-name "Mi Proyecto"
```

Para actualizar tu fork con las mejoras y correcciones de la plantilla en el futuro, consulta la [Guía de Actualización de Forks](docs/development/fork-update-guide.md).

