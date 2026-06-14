# Plan de Implementación — Fase 14: Configuración por Tenant

Esta fase implementará el sistema de configuración flexible por tenant, permitiendo la personalización dinámica de parámetros de la aplicación (General, Branding, Localización, Notificaciones, Seguridad) sin alterar el código fuente.

## User Review Required

Documentación de los principales componentes a añadir:
- **Encriptación AES-256-GCM**: Los secretos (ej. contraseñas de correos o API keys) se guardarán cifrados en base de datos.
- **Cache en Memoria con Inactivación**: Caché ultra-rápida de lectura de configuraciones por tenant para no impactar el rendimiento en cada request de frontend, invalidada automáticamente tras cualquier actualización.
- **Branding Dinámico**: Carga del color primario, logo y textos específicos del tenant en el inicio de sesión y layout principal.

---

## Proposed Changes

### 1. Backend API (`apps/api`)

#### [NEW] [crypto.ts](file:///home/juan/Documentos/Dev/Proyectos/AppBase/apps/api/src/common/crypto.ts)
- Creación de un helper para cifrar/descifrar valores utilizando AES-256-GCM con el secreto del sistema `JWT_ACCESS_SECRET`.

#### [NEW] [settings.config.ts](file:///home/juan/Documentos/Dev/Proyectos/AppBase/apps/api/src/modules/settings/settings.config.ts)
- Definición del catálogo de claves válidas de configuración, sus tipos (`STRING`, `NUMBER`, `BOOLEAN`, `JSON`, `SECRET_REFERENCE`), visibilidad pública/privada y valores iniciales por defecto.

#### [NEW] [settings.repository.ts](file:///home/juan/Documentos/Dev/Proyectos/AppBase/apps/api/src/modules/settings/settings.repository.ts)
- Implementación de consultas para buscar las configuraciones guardadas de un inquilino e insertar/actualizar registros en la tabla `tenant_settings`.

#### [NEW] [settings.service.ts](file:///home/juan/Documentos/Dev/Proyectos/AppBase/apps/api/src/modules/settings/settings.service.ts)
- Lógica de negocio para:
  - Validar tipos de datos y claves antes de guardar.
  - Enmascarar referencias de secretos (`SECRET_REFERENCE`) al retornar al cliente.
  - Cifrado transparente de datos confidenciales.
  - Almacenar temporalmente en caché de memoria (`Map` con TTL) e invalidar la caché tras la edición.
  - Escribir en la bitácora de auditoría al realizar actualizaciones.

#### [NEW] [settings.controller.ts](file:///home/juan/Documentos/Dev/Proyectos/AppBase/apps/api/src/modules/settings/settings.controller.ts)
- Controladores para:
  - `GET /api/v1/settings/public`: Obtención sin autenticar del branding/parámetros públicos mediante resolución automática de tenant (cabeceras `x-tenant-id` / `x-tenant-code` o subdominios).
  - `GET /api/v1/settings`: Retorna la configuración de uso interno (para administradores).
  - `PUT /api/v1/settings`: Modifica y actualiza la lista de configuraciones de un inquilino.

#### [NEW] [settings.routes.ts](file:///home/juan/Documentos/Dev/Proyectos/AppBase/apps/api/src/modules/settings/settings.routes.ts)
- Exposición de endpoints de lectura y actualización.

#### [MODIFY] [main.ts](file:///home/juan/Documentos/Dev/Proyectos/AppBase/apps/api/src/main.ts)
- Registro del nuevo enrutador de configuración `/settings`.

---

### 2. Web Frontend (`apps/web`)

#### [MODIFY] [api.ts](file:///home/juan/Documentos/Dev/Proyectos/AppBase/apps/web/src/lib/api.ts)
- Resolución automática de subdominio inyectando cabecera `x-tenant-code` para asegurar peticiones contextuales.

#### [MODIFY] [App.tsx](file:///home/juan/Documentos/Dev/Proyectos/AppBase/apps/web/src/App.tsx)
- **SettingsView**: Interfaz de pestañas (General, Branding, Localización, Notificaciones, Seguridad) con campos validados según su tipo nativo, guardado en lote y aviso de éxito.
- **Branding Dinámico**: Petición asíncrona a `/settings/public` en la carga del sitio. Refleja dinámicamente el título y el color primario (`--primary`) del branding del tenant mediante inyección en el CSS raíz.

---

## Verification Plan

### Automated Tests
- Ejecutar compilación completa para validar integridad de tipos:
  ```bash
  bun run build
  ```

### Manual Verification
- Autenticarse como administrador de inquilino.
- Modificar el color primario de branding de azul a morado (`#7C3AED`).
- Recargar el login y validar que el botón de login ahora luzca el nuevo color de forma dinámica.
- Validar mediante llamada REST que el secreto modificado no se filtre (solo retorna `********`).
