# Guía de Creación de Forks — BaseForge SaaS

> **BF-3214** — Versión 1.0 — 2026-06-14

Esta guía detalla el proceso correcto para crear una nueva aplicación (un fork funcional) utilizando la plantilla BaseForge SaaS.

---

> [!WARNING]
> **NO ejecutes el script de creación en la carpeta raíz de tu plantilla (`AppBase`)**, a menos que desees renombrar la plantilla misma. El script modifica los archivos *in-place* (directamente sobre los archivos existentes en la carpeta de ejecución).

---

## Proceso Paso a Paso

### Paso 1: Crear un Repositorio en GitHub
Crea un nuevo repositorio en GitHub para tu nueva aplicación.
* Debe ser un repositorio completamente **vacío** (no marques las opciones de agregar `README.md`, `.gitignore` ni licencia).
* Ejemplo de URL del repositorio: `https://github.com/tu-usuario/mi-nuevo-saas.git`

### Paso 2: Clonar la Plantilla en una Nueva Carpeta
Clona el repositorio de la plantilla base en una carpeta local dedicada para tu nuevo proyecto:

```bash
# Clona el repositorio base en la carpeta 'mi-nuevo-saas'
git clone https://github.com/tu-usuario/AppBase.git mi-nuevo-saas
```

### Paso 3: Acceder al Nuevo Directorio
Entra a la carpeta recién creada:

```bash
cd mi-nuevo-saas
```

### Paso 4: Ejecutar el Generador del Fork
Corre el script CLI proporcionado por la plantilla. Este script automatiza los reemplazos de nombres, branding e identificadores:

```bash
bun run create-app \
  --name mi-nuevo-saas \
  --display-name "Mi Nuevo SaaS" \
  --author "Tu Nombre" \
  --description "Descripción corta de la aplicación"
```

> [!NOTE]
> * `--name`: Debe ser en minúsculas y formato kebab-case (ej. `mi-nuevo-saas`). Será usado en package.json, base de datos y esquemas.
> * `--display-name`: Nombre visible en la interfaz (ej. `"Mi Nuevo SaaS"`).

### Paso 5: Configurar los Orígenes de Git (Remotes)
Reorganiza los remotes de Git para poder empujar cambios a tu nuevo repositorio y, al mismo tiempo, mantener una conexión con la plantilla original para recibir futuras actualizaciones.

```bash
# 1. Renombra el origin actual (que apunta a la plantilla) a 'upstream'
git remote rename origin upstream

# 2. Agrega tu nuevo repositorio de GitHub como el 'origin' principal
git remote add origin https://github.com/tu-usuario/mi-nuevo-saas.git

# 3. Sube el código de la rama principal a tu nuevo repositorio
git push -u origin main
```

---

## ¿Qué hace el script bajo el capó?

Cuando ejecutas `bun run create-app`, el generador realiza las siguientes tareas automáticas:

1. **Reemplazo masivo de nombres (70+ archivos):** Cambia toda referencia a `BaseForge` / `baseforge` por el nombre técnico y visible de tu aplicación en archivos de código, configs de TypeScript, configs de bundlers y documentación.
2. **Actualización de IDs Mobile:** Configura `apps/mobile/app.json` actualizando el `slug`, `name` y `scheme` para Expo.
3. **Generación de Entorno:** Copia y adapta `.env.example` para generar tu archivo `.env` local con nombres de base de datos personalizados (ej. `mi_nuevo_saas_db`).
4. **Migración de Dominio Inicial:** Crea un archivo de esquema TypeScript `apps/api/src/database/mi-nuevo-saas-schema.ts` y un archivo SQL de migración en `database/migrations/` bajo el nuevo esquema de base de datos.
5. **Instalación:** Ejecuta `bun install` para asegurar que las dependencias estén actualizadas.
6. **Commit Inicial:** Hace `git add -A` y realiza un commit local con el mensaje `chore: init mi-nuevo-saas — fork de BaseForge SaaS`.

---

## Mantener el Fork Actualizado

Para recibir mejoras de la plantilla base en el futuro, consulta la [Guía de Actualización de Forks](fork-update-guide.md).
