-- =============================================================================
-- BaseForge SaaS
-- Datos base / Seed inicial
-- Versión: 002
-- Fecha: 2026-06-13
--
-- Requiere:
--   001_baseforge_initial_migration.sql
--
-- OBJETIVO
--   Crear datos mínimos para ejecutar y probar la aplicación:
--     - Usuario superadministrador.
--     - Tenant de demostración.
--     - Administrador del tenant.
--     - Usuario estándar del tenant.
--     - Catálogo de permisos.
--     - Roles y asignaciones.
--     - Menús base.
--     - Planes, features y límites.
--     - Suscripción PRO para el tenant demo.
--     - Configuración inicial del tenant.
--
-- ADVERTENCIA
--   Este archivo contiene credenciales temporales de DESARROLLO.
--   No debe ejecutarse sin revisión en producción.
--
-- CREDENCIALES PARA UNA BASE NUEVA
--
--   Superadmin
--     Usuario:    superadmin@baseforge.local
--     Contraseña: ChangeMe.SuperAdmin.2026!
--
--   Administrador del tenant demo
--     Usuario:    admin@demo.baseforge.local
--     Contraseña: ChangeMe.TenantAdmin.2026!
--
--   Usuario estándar del tenant demo
--     Usuario:    user@demo.baseforge.local
--     Contraseña: ChangeMe.TenantUser.2026!
--
-- Todos los usuarios quedan con must_change_password = true.
--
-- IDEMPOTENCIA
--   El script puede ejecutarse varias veces.
--   Por seguridad, una nueva ejecución NO reemplaza contraseñas ya existentes.
--
-- HASH DE CONTRASEÑAS
--   Se usa pgcrypto con bcrypt:
--     crypt(password, gen_salt('bf', 12))
--
-- EJECUCIÓN
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f 002_baseforge_seed_data.sql
-- =============================================================================

BEGIN;

SET search_path TO app, public;

-- Si el ambiente fue identificado explícitamente como producción, detener.
DO $$
BEGIN
    IF lower(COALESCE(current_setting('app.environment', true), 'development')) = 'production' THEN
        RAISE EXCEPTION
            'El seed de demostración no puede ejecutarse con app.environment=production';
    END IF;
END;
$$;

-- El seed necesita acceso transversal a todos los tenants.
SELECT app.set_request_context(NULL, NULL, true);

-- =============================================================================
-- 1. USUARIOS BASE
-- =============================================================================

INSERT INTO app.platform_users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    display_name,
    status,
    locale,
    timezone,
    email_verified_at,
    must_change_password,
    metadata
)
VALUES
(
    '00000000-0000-4000-8000-000000000001',
    'superadmin@baseforge.local',
    crypt('ChangeMe.SuperAdmin.2026!', gen_salt('bf', 12)),
    'Super',
    'Administrador',
    'Superadministrador BaseForge',
    'ACTIVE',
    'es-CO',
    'America/Bogota',
    now(),
    true,
    '{"seed": true, "accountType": "SUPER_ADMIN"}'::jsonb
),
(
    '00000000-0000-4000-8000-000000000002',
    'admin@demo.baseforge.local',
    crypt('ChangeMe.TenantAdmin.2026!', gen_salt('bf', 12)),
    'Administrador',
    'Demo',
    'Administrador Tenant Demo',
    'ACTIVE',
    'es-CO',
    'America/Bogota',
    now(),
    true,
    '{"seed": true, "accountType": "TENANT_ADMIN"}'::jsonb
),
(
    '00000000-0000-4000-8000-000000000003',
    'user@demo.baseforge.local',
    crypt('ChangeMe.TenantUser.2026!', gen_salt('bf', 12)),
    'Usuario',
    'Demo',
    'Usuario Tenant Demo',
    'ACTIVE',
    'es-CO',
    'America/Bogota',
    now(),
    true,
    '{"seed": true, "accountType": "TENANT_USER"}'::jsonb
)
ON CONFLICT (email)
DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    status = 'ACTIVE',
    locale = EXCLUDED.locale,
    timezone = EXCLUDED.timezone,
    email_verified_at = COALESCE(app.platform_users.email_verified_at, now()),
    deleted_at = NULL,
    metadata = app.platform_users.metadata || EXCLUDED.metadata,
    updated_at = now();

-- =============================================================================
-- 2. TENANT DE DEMOSTRACIÓN
-- =============================================================================

INSERT INTO app.tenants (
    id,
    code,
    slug,
    legal_name,
    display_name,
    tax_id,
    country_code,
    currency_code,
    timezone,
    locale,
    status,
    primary_color,
    support_email,
    metadata,
    created_by,
    updated_by
)
SELECT
    '10000000-0000-4000-8000-000000000001',
    'DEMO',
    'demo',
    'BaseForge Demo S.A.S.',
    'BaseForge Demo',
    '900000000-1',
    'CO',
    'COP',
    'America/Bogota',
    'es-CO',
    'ACTIVE',
    '#2563EB',
    'admin@demo.baseforge.local',
    '{"seed": true, "environment": "DEMO"}'::jsonb,
    u.id,
    u.id
FROM app.platform_users u
WHERE u.email = 'superadmin@baseforge.local'
ON CONFLICT (code)
DO UPDATE SET
    slug = EXCLUDED.slug,
    legal_name = EXCLUDED.legal_name,
    display_name = EXCLUDED.display_name,
    country_code = EXCLUDED.country_code,
    currency_code = EXCLUDED.currency_code,
    timezone = EXCLUDED.timezone,
    locale = EXCLUDED.locale,
    status = 'ACTIVE',
    primary_color = EXCLUDED.primary_color,
    support_email = EXCLUDED.support_email,
    metadata = app.tenants.metadata || EXCLUDED.metadata,
    deleted_at = NULL,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

-- =============================================================================
-- 3. MEMBRESÍAS DEL TENANT
-- =============================================================================

INSERT INTO app.tenant_users (
    tenant_id,
    user_id,
    status,
    is_owner,
    joined_at,
    invited_by
)
SELECT
    t.id,
    u.id,
    'ACTIVE',
    true,
    now(),
    sa.id
FROM app.tenants t
JOIN app.platform_users u
    ON u.email = 'admin@demo.baseforge.local'
JOIN app.platform_users sa
    ON sa.email = 'superadmin@baseforge.local'
WHERE t.code = 'DEMO'
ON CONFLICT (tenant_id, user_id)
DO UPDATE SET
    status = 'ACTIVE',
    is_owner = true,
    joined_at = COALESCE(app.tenant_users.joined_at, now()),
    deleted_at = NULL,
    updated_at = now();

INSERT INTO app.tenant_users (
    tenant_id,
    user_id,
    status,
    is_owner,
    joined_at,
    invited_by
)
SELECT
    t.id,
    u.id,
    'ACTIVE',
    false,
    now(),
    admin_user.id
FROM app.tenants t
JOIN app.platform_users u
    ON u.email = 'user@demo.baseforge.local'
JOIN app.platform_users admin_user
    ON admin_user.email = 'admin@demo.baseforge.local'
WHERE t.code = 'DEMO'
ON CONFLICT (tenant_id, user_id)
DO UPDATE SET
    status = 'ACTIVE',
    is_owner = false,
    joined_at = COALESCE(app.tenant_users.joined_at, now()),
    deleted_at = NULL,
    updated_at = now();

-- =============================================================================
-- 4. CATÁLOGO DE PERMISOS
-- =============================================================================

INSERT INTO app.permissions (
    id,
    code,
    resource,
    action,
    name,
    description,
    scope,
    is_system
)
VALUES
-- Navegación y perfil
('30000000-0000-4000-8000-000000000001', 'dashboard.read',       'dashboard',     'read',       'Ver dashboard',                  'Permite consultar el dashboard.',                           'BOTH',     true),
('30000000-0000-4000-8000-000000000002', 'profile.read',         'profile',       'read',       'Ver perfil',                     'Permite consultar el perfil propio.',                       'BOTH',     true),
('30000000-0000-4000-8000-000000000003', 'profile.update',       'profile',       'update',     'Actualizar perfil',              'Permite actualizar el perfil propio.',                      'BOTH',     true),

-- Tenants y soporte
('30000000-0000-4000-8000-000000000004', 'tenants.read',         'tenants',       'read',       'Ver tenants',                    'Permite consultar tenants.',                                'PLATFORM', true),
('30000000-0000-4000-8000-000000000005', 'tenants.create',       'tenants',       'create',     'Crear tenants',                  'Permite crear tenants.',                                    'PLATFORM', true),
('30000000-0000-4000-8000-000000000006', 'tenants.update',       'tenants',       'update',     'Actualizar tenants',             'Permite actualizar tenants.',                               'PLATFORM', true),
('30000000-0000-4000-8000-000000000007', 'tenants.suspend',      'tenants',       'suspend',    'Suspender tenants',              'Permite suspender o reactivar tenants.',                    'PLATFORM', true),
('30000000-0000-4000-8000-000000000008', 'support.impersonate',  'support',       'impersonate','Ingresar en modo soporte',       'Permite operar temporalmente sobre un tenant.',             'PLATFORM', true),

-- Usuarios y sesiones
('30000000-0000-4000-8000-000000000009', 'users.read',           'users',         'read',       'Ver usuarios',                   'Permite consultar usuarios del tenant.',                    'TENANT',   true),
('30000000-0000-4000-8000-000000000010', 'users.create',         'users',         'create',     'Crear usuarios',                 'Permite crear e invitar usuarios.',                         'TENANT',   true),
('30000000-0000-4000-8000-000000000011', 'users.update',         'users',         'update',     'Actualizar usuarios',            'Permite actualizar usuarios.',                              'TENANT',   true),
('30000000-0000-4000-8000-000000000012', 'users.delete',         'users',         'delete',     'Desactivar usuarios',            'Permite desactivar usuarios.',                              'TENANT',   true),
('30000000-0000-4000-8000-000000000013', 'sessions.read',        'sessions',      'read',       'Ver sesiones',                   'Permite consultar sesiones activas.',                       'TENANT',   true),
('30000000-0000-4000-8000-000000000014', 'sessions.revoke',      'sessions',      'revoke',     'Revocar sesiones',               'Permite cerrar sesiones activas.',                          'TENANT',   true),

-- Roles y permisos
('30000000-0000-4000-8000-000000000015', 'roles.read',           'roles',         'read',       'Ver roles',                      'Permite consultar roles.',                                  'TENANT',   true),
('30000000-0000-4000-8000-000000000016', 'roles.create',         'roles',         'create',     'Crear roles',                    'Permite crear roles.',                                      'TENANT',   true),
('30000000-0000-4000-8000-000000000017', 'roles.update',         'roles',         'update',     'Actualizar roles',               'Permite actualizar roles.',                                 'TENANT',   true),
('30000000-0000-4000-8000-000000000018', 'roles.delete',         'roles',         'delete',     'Eliminar roles',                 'Permite eliminar roles no protegidos.',                     'TENANT',   true),
('30000000-0000-4000-8000-000000000019', 'permissions.read',     'permissions',   'read',       'Ver permisos',                   'Permite consultar el catálogo de permisos.',                'BOTH',     true),

-- Menús
('30000000-0000-4000-8000-000000000020', 'menus.read',           'menus',         'read',       'Ver menús',                      'Permite consultar la configuración de menús.',              'TENANT',   true),
('30000000-0000-4000-8000-000000000021', 'menus.create',         'menus',         'create',     'Crear menús',                    'Permite crear menús personalizados.',                       'TENANT',   true),
('30000000-0000-4000-8000-000000000022', 'menus.update',         'menus',         'update',     'Actualizar menús',               'Permite actualizar menús.',                                 'TENANT',   true),
('30000000-0000-4000-8000-000000000023', 'menus.delete',         'menus',         'delete',     'Eliminar menús',                 'Permite eliminar menús personalizados.',                    'TENANT',   true),

-- Planes, features y suscripciones
('30000000-0000-4000-8000-000000000024', 'plans.read',           'plans',         'read',       'Ver planes',                     'Permite consultar planes.',                                 'PLATFORM', true),
('30000000-0000-4000-8000-000000000025', 'plans.create',         'plans',         'create',     'Crear planes',                   'Permite crear planes.',                                     'PLATFORM', true),
('30000000-0000-4000-8000-000000000026', 'plans.update',         'plans',         'update',     'Actualizar planes',              'Permite actualizar planes.',                                'PLATFORM', true),
('30000000-0000-4000-8000-000000000027', 'features.read',        'features',      'read',       'Ver features',                   'Permite consultar features.',                               'PLATFORM', true),
('30000000-0000-4000-8000-000000000028', 'features.create',      'features',      'create',     'Crear features',                 'Permite crear features.',                                   'PLATFORM', true),
('30000000-0000-4000-8000-000000000029', 'features.update',      'features',      'update',     'Actualizar features',            'Permite actualizar features.',                              'PLATFORM', true),
('30000000-0000-4000-8000-000000000030', 'subscriptions.read',   'subscriptions', 'read',       'Ver suscripción',                'Permite consultar la suscripción del tenant.',              'BOTH',     true),
('30000000-0000-4000-8000-000000000031', 'subscriptions.update', 'subscriptions', 'update',     'Actualizar suscripción',         'Permite cambiar o administrar suscripciones.',              'PLATFORM', true),

-- Configuración y auditoría
('30000000-0000-4000-8000-000000000032', 'settings.read',        'settings',      'read',       'Ver configuración',              'Permite consultar la configuración del tenant.',            'TENANT',   true),
('30000000-0000-4000-8000-000000000033', 'settings.update',      'settings',      'update',     'Actualizar configuración',       'Permite modificar la configuración del tenant.',            'TENANT',   true),
('30000000-0000-4000-8000-000000000034', 'audit.read',           'audit',         'read',       'Ver auditoría',                  'Permite consultar la auditoría.',                           'BOTH',     true),

-- Notificaciones
('30000000-0000-4000-8000-000000000035', 'notifications.read',   'notifications', 'read',       'Ver notificaciones',             'Permite consultar notificaciones propias.',                 'TENANT',   true),
('30000000-0000-4000-8000-000000000036', 'notifications.update', 'notifications', 'update',     'Actualizar notificaciones',      'Permite marcar o archivar notificaciones propias.',         'TENANT',   true),

-- Archivos
('30000000-0000-4000-8000-000000000037', 'files.read',           'files',         'read',       'Ver archivos',                   'Permite consultar y descargar archivos.',                   'TENANT',   true),
('30000000-0000-4000-8000-000000000038', 'files.create',         'files',         'create',     'Cargar archivos',                'Permite cargar archivos.',                                  'TENANT',   true),
('30000000-0000-4000-8000-000000000039', 'files.delete',         'files',         'delete',     'Eliminar archivos',              'Permite eliminar archivos.',                                'TENANT',   true),

-- API keys
('30000000-0000-4000-8000-000000000040', 'api_keys.read',        'api_keys',      'read',       'Ver API keys',                   'Permite consultar API keys sin revelar secretos.',          'TENANT',   true),
('30000000-0000-4000-8000-000000000041', 'api_keys.create',      'api_keys',      'create',     'Crear API keys',                 'Permite crear API keys.',                                   'TENANT',   true),
('30000000-0000-4000-8000-000000000042', 'api_keys.revoke',      'api_keys',      'revoke',     'Revocar API keys',               'Permite revocar API keys.',                                 'TENANT',   true),

-- Webhooks
('30000000-0000-4000-8000-000000000043', 'webhooks.read',        'webhooks',      'read',       'Ver webhooks',                   'Permite consultar webhooks.',                               'TENANT',   true),
('30000000-0000-4000-8000-000000000044', 'webhooks.create',      'webhooks',      'create',     'Crear webhooks',                 'Permite crear webhooks.',                                   'TENANT',   true),
('30000000-0000-4000-8000-000000000045', 'webhooks.update',      'webhooks',      'update',     'Actualizar webhooks',            'Permite actualizar webhooks.',                              'TENANT',   true),
('30000000-0000-4000-8000-000000000046', 'webhooks.delete',      'webhooks',      'delete',     'Eliminar webhooks',              'Permite eliminar webhooks.',                                'TENANT',   true)
ON CONFLICT (code)
DO UPDATE SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    scope = EXCLUDED.scope,
    is_system = true,
    updated_at = now();

-- =============================================================================
-- 5. ROLES BASE
-- =============================================================================

-- Rol global de superadministrador.
INSERT INTO app.roles (
    id,
    tenant_id,
    code,
    name,
    description,
    scope,
    is_system,
    is_default,
    metadata,
    created_by,
    updated_by
)
SELECT
    '20000000-0000-4000-8000-000000000001',
    NULL,
    'SUPER_ADMIN',
    'Superadministrador',
    'Acceso completo a la plataforma y al modo soporte.',
    'PLATFORM',
    true,
    false,
    '{"seed": true, "protected": true}'::jsonb,
    u.id,
    u.id
FROM app.platform_users u
WHERE u.email = 'superadmin@baseforge.local'
  AND NOT EXISTS (
      SELECT 1
      FROM app.roles r
      WHERE r.tenant_id IS NULL
        AND r.code = 'SUPER_ADMIN'
        AND r.deleted_at IS NULL
  );

UPDATE app.roles
SET
    name = 'Superadministrador',
    description = 'Acceso completo a la plataforma y al modo soporte.',
    scope = 'PLATFORM',
    is_system = true,
    is_default = false,
    deleted_at = NULL,
    metadata = metadata || '{"seed": true, "protected": true}'::jsonb,
    updated_at = now()
WHERE tenant_id IS NULL
  AND code = 'SUPER_ADMIN';

-- Roles del tenant demo.
INSERT INTO app.roles (
    id,
    tenant_id,
    code,
    name,
    description,
    scope,
    is_system,
    is_default,
    metadata,
    created_by,
    updated_by
)
SELECT
    '20000000-0000-4000-8000-000000000002',
    t.id,
    'TENANT_ADMIN',
    'Administrador del tenant',
    'Administra usuarios, roles, configuración y módulos del tenant.',
    'TENANT',
    true,
    false,
    '{"seed": true, "protected": true}'::jsonb,
    u.id,
    u.id
FROM app.tenants t
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
WHERE t.code = 'DEMO'
  AND NOT EXISTS (
      SELECT 1
      FROM app.roles r
      WHERE r.tenant_id = t.id
        AND r.code = 'TENANT_ADMIN'
        AND r.deleted_at IS NULL
  );

INSERT INTO app.roles (
    id,
    tenant_id,
    code,
    name,
    description,
    scope,
    is_system,
    is_default,
    metadata,
    created_by,
    updated_by
)
SELECT
    '20000000-0000-4000-8000-000000000003',
    t.id,
    'TENANT_USER',
    'Usuario estándar',
    'Rol base para usuarios operativos del tenant.',
    'TENANT',
    true,
    true,
    '{"seed": true, "protected": true}'::jsonb,
    u.id,
    u.id
FROM app.tenants t
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
WHERE t.code = 'DEMO'
  AND NOT EXISTS (
      SELECT 1
      FROM app.roles r
      WHERE r.tenant_id = t.id
        AND r.code = 'TENANT_USER'
        AND r.deleted_at IS NULL
  );

UPDATE app.roles r
SET
    name = values_to_apply.name,
    description = values_to_apply.description,
    is_system = true,
    is_default = values_to_apply.is_default,
    deleted_at = NULL,
    metadata = r.metadata || '{"seed": true, "protected": true}'::jsonb,
    updated_at = now()
FROM (
    VALUES
        ('TENANT_ADMIN'::citext, 'Administrador del tenant'::varchar, 'Administra usuarios, roles, configuración y módulos del tenant.'::text, false),
        ('TENANT_USER'::citext,  'Usuario estándar'::varchar,        'Rol base para usuarios operativos del tenant.'::text,              true)
) AS values_to_apply(code, name, description, is_default)
JOIN app.tenants t
    ON t.code = 'DEMO'
WHERE r.tenant_id = t.id
  AND r.code = values_to_apply.code;

-- =============================================================================
-- 6. PERMISOS POR ROL
-- =============================================================================

-- El superadministrador recibe todo el catálogo.
INSERT INTO app.role_permissions (
    role_id,
    permission_id,
    granted_by
)
SELECT
    r.id,
    p.id,
    u.id
FROM app.roles r
CROSS JOIN app.permissions p
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
WHERE r.tenant_id IS NULL
  AND r.code = 'SUPER_ADMIN'
ON CONFLICT (role_id, permission_id)
DO NOTHING;

-- El administrador del tenant recibe permisos tenant y permisos BOTH.
INSERT INTO app.role_permissions (
    role_id,
    permission_id,
    granted_by
)
SELECT
    r.id,
    p.id,
    u.id
FROM app.roles r
JOIN app.tenants t
    ON t.id = r.tenant_id
CROSS JOIN app.permissions p
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
WHERE t.code = 'DEMO'
  AND r.code = 'TENANT_ADMIN'
  AND p.scope IN ('TENANT', 'BOTH')
ON CONFLICT (role_id, permission_id)
DO NOTHING;

-- El usuario estándar recibe únicamente permisos personales y operativos base.
INSERT INTO app.role_permissions (
    role_id,
    permission_id,
    granted_by
)
SELECT
    r.id,
    p.id,
    u.id
FROM app.roles r
JOIN app.tenants t
    ON t.id = r.tenant_id
JOIN app.permissions p
    ON p.code IN (
        'dashboard.read',
        'profile.read',
        'profile.update',
        'notifications.read',
        'notifications.update'
    )
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
WHERE t.code = 'DEMO'
  AND r.code = 'TENANT_USER'
ON CONFLICT (role_id, permission_id)
DO NOTHING;

-- =============================================================================
-- 7. ROLES POR USUARIO
-- =============================================================================

INSERT INTO app.user_roles (
    tenant_id,
    user_id,
    role_id,
    assigned_by
)
SELECT
    NULL,
    super_user.id,
    r.id,
    super_user.id
FROM app.platform_users super_user
JOIN app.roles r
    ON r.tenant_id IS NULL
   AND r.code = 'SUPER_ADMIN'
WHERE super_user.email = 'superadmin@baseforge.local'
ON CONFLICT DO NOTHING;

INSERT INTO app.user_roles (
    tenant_id,
    user_id,
    role_id,
    assigned_by
)
SELECT
    t.id,
    tenant_admin.id,
    r.id,
    super_user.id
FROM app.tenants t
JOIN app.platform_users tenant_admin
    ON tenant_admin.email = 'admin@demo.baseforge.local'
JOIN app.platform_users super_user
    ON super_user.email = 'superadmin@baseforge.local'
JOIN app.roles r
    ON r.tenant_id = t.id
   AND r.code = 'TENANT_ADMIN'
WHERE t.code = 'DEMO'
ON CONFLICT DO NOTHING;

INSERT INTO app.user_roles (
    tenant_id,
    user_id,
    role_id,
    assigned_by
)
SELECT
    t.id,
    tenant_user.id,
    r.id,
    tenant_admin.id
FROM app.tenants t
JOIN app.platform_users tenant_user
    ON tenant_user.email = 'user@demo.baseforge.local'
JOIN app.platform_users tenant_admin
    ON tenant_admin.email = 'admin@demo.baseforge.local'
JOIN app.roles r
    ON r.tenant_id = t.id
   AND r.code = 'TENANT_USER'
WHERE t.code = 'DEMO'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 8. PLANES
-- =============================================================================

INSERT INTO app.plans (
    id,
    code,
    name,
    description,
    status,
    billing_cycle,
    price,
    currency_code,
    trial_days,
    is_public,
    is_default,
    sort_order,
    metadata,
    created_by,
    updated_by
)
SELECT
    values_to_apply.id::uuid,
    values_to_apply.code,
    values_to_apply.name,
    values_to_apply.description,
    'ACTIVE',
    values_to_apply.billing_cycle,
    values_to_apply.price,
    'COP',
    values_to_apply.trial_days,
    values_to_apply.is_public,
    false,
    values_to_apply.sort_order,
    '{"seed": true}'::jsonb,
    u.id,
    u.id
FROM (
    VALUES
        ('40000000-0000-4000-8000-000000000001', 'FREE'::citext,       'Free'::varchar,       'Plan inicial para evaluación y uso limitado.'::text,              'FREE'::varchar,    0::numeric,       0,  true,  10),
        ('40000000-0000-4000-8000-000000000002', 'BASIC'::citext,      'Basic'::varchar,      'Plan para equipos pequeños.'::text,                               'MONTHLY'::varchar, 49000::numeric,   15,  true,  20),
        ('40000000-0000-4000-8000-000000000003', 'PRO'::citext,        'Pro'::varchar,        'Plan con funciones avanzadas e integraciones.'::text,             'MONTHLY'::varchar, 119000::numeric,  15,  true,  30),
        ('40000000-0000-4000-8000-000000000004', 'ENTERPRISE'::citext, 'Enterprise'::varchar, 'Plan personalizado para organizaciones de mayor tamaño.'::text,   'CUSTOM'::varchar,  0::numeric,       30,  false, 40)
) AS values_to_apply(
    id,
    code,
    name,
    description,
    billing_cycle,
    price,
    trial_days,
    is_public,
    sort_order
)
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
ON CONFLICT (code)
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = 'ACTIVE',
    billing_cycle = EXCLUDED.billing_cycle,
    price = EXCLUDED.price,
    currency_code = EXCLUDED.currency_code,
    trial_days = EXCLUDED.trial_days,
    is_public = EXCLUDED.is_public,
    sort_order = EXCLUDED.sort_order,
    deleted_at = NULL,
    metadata = app.plans.metadata || EXCLUDED.metadata,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

-- Un solo plan por defecto. Se realiza en dos pasos para evitar conflictos
-- temporales con el índice único parcial uq_plans_single_default.
UPDATE app.plans
SET
    is_default = false,
    updated_at = now()
WHERE code IN ('FREE', 'BASIC', 'PRO', 'ENTERPRISE')
  AND is_default = true;

UPDATE app.plans
SET
    is_default = true,
    updated_at = now()
WHERE code = 'FREE'
  AND is_default = false;

-- =============================================================================
-- 9. FEATURES Y LÍMITES DE PLAN
-- =============================================================================

INSERT INTO app.features (
    id,
    code,
    name,
    description,
    value_type,
    default_value,
    is_system,
    metadata
)
VALUES
('50000000-0000-4000-8000-000000000001', 'mobile.enabled',              'Aplicación mobile',             'Habilita el acceso a la aplicación móvil.',                     'BOOLEAN', 'false'::jsonb,       true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000002', 'audit.enabled',               'Auditoría',                     'Habilita la consulta de auditoría.',                            'BOOLEAN', 'false'::jsonb,       true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000003', 'files.enabled',               'Archivos',                      'Habilita carga y gestión de archivos.',                         'BOOLEAN', 'false'::jsonb,       true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000004', 'notifications.enabled',       'Notificaciones',                'Habilita notificaciones internas.',                             'BOOLEAN', 'true'::jsonb,        true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000005', 'custom_roles.enabled',        'Roles personalizados',          'Permite crear roles propios.',                                  'BOOLEAN', 'false'::jsonb,       true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000006', 'custom_branding.enabled',     'Branding personalizado',        'Permite logo y colores propios.',                               'BOOLEAN', 'false'::jsonb,       true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000007', 'api_keys.enabled',            'API keys',                      'Permite crear credenciales de integración.',                    'BOOLEAN', 'false'::jsonb,       true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000008', 'webhooks.enabled',            'Webhooks',                      'Permite configurar webhooks.',                                  'BOOLEAN', 'false'::jsonb,       true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000009', 'api.access',                  'Acceso API',                    'Habilita consumo externo de API.',                              'BOOLEAN', 'false'::jsonb,       true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000010', 'exports.excel',               'Exportación a Excel',           'Habilita exportaciones.',                                       'BOOLEAN', 'false'::jsonb,       true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000011', 'reports.advanced',            'Reportes avanzados',            'Habilita reportes avanzados.',                                  'BOOLEAN', 'false'::jsonb,       true, '{"seed": true}'::jsonb),
('50000000-0000-4000-8000-000000000012', 'limits.users',                'Límite de usuarios',            'Cantidad máxima de usuarios activos.',                          'INTEGER', '2'::jsonb,           true, '{"seed": true, "unit": "users"}'::jsonb),
('50000000-0000-4000-8000-000000000013', 'limits.storage_bytes',        'Límite de almacenamiento',      'Cantidad máxima de almacenamiento en bytes.',                   'INTEGER', '104857600'::jsonb,   true, '{"seed": true, "unit": "bytes"}'::jsonb),
('50000000-0000-4000-8000-000000000014', 'limits.api_requests_monthly', 'Límite mensual de API',         'Cantidad máxima mensual de solicitudes a la API externa.',      'INTEGER', '0'::jsonb,           true, '{"seed": true, "unit": "requests"}'::jsonb)
ON CONFLICT (code)
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    value_type = EXCLUDED.value_type,
    default_value = EXCLUDED.default_value,
    is_system = true,
    metadata = app.features.metadata || EXCLUDED.metadata,
    updated_at = now();

WITH feature_matrix(plan_code, feature_code, enabled, value) AS (
    VALUES
    -- FREE
    ('FREE', 'mobile.enabled',              false, 'false'::jsonb),
    ('FREE', 'audit.enabled',               false, 'false'::jsonb),
    ('FREE', 'files.enabled',               false, 'false'::jsonb),
    ('FREE', 'notifications.enabled',       true,  'true'::jsonb),
    ('FREE', 'custom_roles.enabled',        false, 'false'::jsonb),
    ('FREE', 'custom_branding.enabled',     false, 'false'::jsonb),
    ('FREE', 'api_keys.enabled',            false, 'false'::jsonb),
    ('FREE', 'webhooks.enabled',            false, 'false'::jsonb),
    ('FREE', 'api.access',                  false, 'false'::jsonb),
    ('FREE', 'exports.excel',               false, 'false'::jsonb),
    ('FREE', 'reports.advanced',            false, 'false'::jsonb),
    ('FREE', 'limits.users',                true,  '2'::jsonb),
    ('FREE', 'limits.storage_bytes',        true,  '104857600'::jsonb),
    ('FREE', 'limits.api_requests_monthly', true,  '0'::jsonb),

    -- BASIC
    ('BASIC', 'mobile.enabled',              true,  'true'::jsonb),
    ('BASIC', 'audit.enabled',               true,  'true'::jsonb),
    ('BASIC', 'files.enabled',               true,  'true'::jsonb),
    ('BASIC', 'notifications.enabled',       true,  'true'::jsonb),
    ('BASIC', 'custom_roles.enabled',        false, 'false'::jsonb),
    ('BASIC', 'custom_branding.enabled',     true,  'true'::jsonb),
    ('BASIC', 'api_keys.enabled',            false, 'false'::jsonb),
    ('BASIC', 'webhooks.enabled',            false, 'false'::jsonb),
    ('BASIC', 'api.access',                  false, 'false'::jsonb),
    ('BASIC', 'exports.excel',               true,  'true'::jsonb),
    ('BASIC', 'reports.advanced',            false, 'false'::jsonb),
    ('BASIC', 'limits.users',                true,  '5'::jsonb),
    ('BASIC', 'limits.storage_bytes',        true,  '1073741824'::jsonb),
    ('BASIC', 'limits.api_requests_monthly', true,  '1000'::jsonb),

    -- PRO
    ('PRO', 'mobile.enabled',              true, 'true'::jsonb),
    ('PRO', 'audit.enabled',               true, 'true'::jsonb),
    ('PRO', 'files.enabled',               true, 'true'::jsonb),
    ('PRO', 'notifications.enabled',       true, 'true'::jsonb),
    ('PRO', 'custom_roles.enabled',        true, 'true'::jsonb),
    ('PRO', 'custom_branding.enabled',     true, 'true'::jsonb),
    ('PRO', 'api_keys.enabled',            true, 'true'::jsonb),
    ('PRO', 'webhooks.enabled',            true, 'true'::jsonb),
    ('PRO', 'api.access',                  true, 'true'::jsonb),
    ('PRO', 'exports.excel',               true, 'true'::jsonb),
    ('PRO', 'reports.advanced',            true, 'true'::jsonb),
    ('PRO', 'limits.users',                true, '25'::jsonb),
    ('PRO', 'limits.storage_bytes',        true, '10737418240'::jsonb),
    ('PRO', 'limits.api_requests_monthly', true, '100000'::jsonb),

    -- ENTERPRISE
    ('ENTERPRISE', 'mobile.enabled',              true, 'true'::jsonb),
    ('ENTERPRISE', 'audit.enabled',               true, 'true'::jsonb),
    ('ENTERPRISE', 'files.enabled',               true, 'true'::jsonb),
    ('ENTERPRISE', 'notifications.enabled',       true, 'true'::jsonb),
    ('ENTERPRISE', 'custom_roles.enabled',        true, 'true'::jsonb),
    ('ENTERPRISE', 'custom_branding.enabled',     true, 'true'::jsonb),
    ('ENTERPRISE', 'api_keys.enabled',            true, 'true'::jsonb),
    ('ENTERPRISE', 'webhooks.enabled',            true, 'true'::jsonb),
    ('ENTERPRISE', 'api.access',                  true, 'true'::jsonb),
    ('ENTERPRISE', 'exports.excel',               true, 'true'::jsonb),
    ('ENTERPRISE', 'reports.advanced',            true, 'true'::jsonb),
    ('ENTERPRISE', 'limits.users',                true, '1000'::jsonb),
    ('ENTERPRISE', 'limits.storage_bytes',        true, '107374182400'::jsonb),
    ('ENTERPRISE', 'limits.api_requests_monthly', true, '1000000'::jsonb)
)
INSERT INTO app.plan_features (
    plan_id,
    feature_id,
    enabled,
    value
)
SELECT
    p.id,
    f.id,
    fm.enabled,
    fm.value
FROM feature_matrix fm
JOIN app.plans p
    ON p.code = fm.plan_code
JOIN app.features f
    ON f.code = fm.feature_code
ON CONFLICT (plan_id, feature_id)
DO UPDATE SET
    enabled = EXCLUDED.enabled,
    value = EXCLUDED.value,
    updated_at = now();

-- =============================================================================
-- 10. SUSCRIPCIÓN PRO DEL TENANT DEMO
-- =============================================================================

INSERT INTO app.subscriptions (
    id,
    tenant_id,
    plan_id,
    status,
    billing_cycle,
    quantity,
    currency_code,
    unit_price,
    starts_at,
    current_period_start,
    current_period_end,
    auto_renew,
    metadata,
    created_by,
    updated_by
)
SELECT
    '70000000-0000-4000-8000-000000000001',
    t.id,
    p.id,
    'ACTIVE',
    p.billing_cycle,
    1,
    p.currency_code,
    p.price,
    now(),
    date_trunc('day', now()),
    date_trunc('day', now()) + interval '1 month',
    true,
    '{"seed": true, "paymentMode": "MANUAL"}'::jsonb,
    u.id,
    u.id
FROM app.tenants t
JOIN app.plans p
    ON p.code = 'PRO'
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
WHERE t.code = 'DEMO'
ON CONFLICT (id)
DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'ACTIVE',
    billing_cycle = EXCLUDED.billing_cycle,
    quantity = EXCLUDED.quantity,
    currency_code = EXCLUDED.currency_code,
    unit_price = EXCLUDED.unit_price,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    auto_renew = true,
    deleted_at = NULL,
    metadata = app.subscriptions.metadata || EXCLUDED.metadata,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

-- =============================================================================
-- 11. LÍMITES MATERIALIZADOS DEL TENANT DEMO
-- =============================================================================

INSERT INTO app.tenant_limits (
    tenant_id,
    metric_key,
    limit_value,
    warning_threshold,
    reset_period,
    metadata,
    updated_by
)
SELECT
    t.id,
    values_to_apply.metric_key,
    values_to_apply.limit_value,
    values_to_apply.warning_threshold,
    values_to_apply.reset_period,
    '{"seed": true, "source": "PRO"}'::jsonb,
    u.id
FROM app.tenants t
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
CROSS JOIN (
    VALUES
        ('users.active'::citext,         25::bigint,          80::numeric, 'NONE'::varchar),
        ('storage.bytes'::citext,        10737418240::bigint, 80::numeric, 'NONE'::varchar),
        ('api.requests.monthly'::citext, 100000::bigint,      80::numeric, 'MONTHLY'::varchar)
) AS values_to_apply(metric_key, limit_value, warning_threshold, reset_period)
WHERE t.code = 'DEMO'
ON CONFLICT (tenant_id, metric_key)
DO UPDATE SET
    limit_value = EXCLUDED.limit_value,
    warning_threshold = EXCLUDED.warning_threshold,
    reset_period = EXCLUDED.reset_period,
    metadata = app.tenant_limits.metadata || EXCLUDED.metadata,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

-- =============================================================================
-- 12. CONFIGURACIÓN INICIAL DEL TENANT
-- =============================================================================

INSERT INTO app.tenant_settings (
    tenant_id,
    key,
    group_name,
    value,
    value_type,
    is_public,
    is_encrypted,
    description,
    updated_by
)
SELECT
    t.id,
    values_to_apply.key,
    values_to_apply.group_name,
    values_to_apply.value,
    values_to_apply.value_type,
    values_to_apply.is_public,
    false,
    values_to_apply.description,
    u.id
FROM app.tenants t
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
CROSS JOIN (
    VALUES
        ('general.app_name'::citext,                 'general'::varchar,      '"BaseForge Demo"'::jsonb,       'STRING'::varchar,  true,  'Nombre visible de la aplicación.'::text),
        ('general.company_name'::citext,             'general'::varchar,      '"BaseForge Demo S.A.S."'::jsonb,'STRING'::varchar,  true,  'Nombre de la organización.'::text),
        ('branding.primary_color'::citext,           'branding'::varchar,     '"#2563EB"'::jsonb,              'STRING'::varchar,  true,  'Color principal.'::text),
        ('branding.logo_url'::citext,                'branding'::varchar,     'null'::jsonb,                   'STRING'::varchar,  true,  'URL del logo.'::text),
        ('localization.country'::citext,             'localization'::varchar, '"CO"'::jsonb,                   'STRING'::varchar,  true,  'Código de país.'::text),
        ('localization.locale'::citext,              'localization'::varchar, '"es-CO"'::jsonb,                'STRING'::varchar,  true,  'Locale principal.'::text),
        ('localization.timezone'::citext,            'localization'::varchar, '"America/Bogota"'::jsonb,       'STRING'::varchar,  true,  'Zona horaria.'::text),
        ('localization.currency'::citext,            'localization'::varchar, '"COP"'::jsonb,                  'STRING'::varchar,  true,  'Moneda principal.'::text),
        ('localization.date_format'::citext,         'localization'::varchar, '"DD/MM/YYYY"'::jsonb,           'STRING'::varchar,  true,  'Formato visual de fecha.'::text),
        ('notifications.email.enabled'::citext,      'notifications'::varchar,'false'::jsonb,                  'BOOLEAN'::varchar, false, 'Habilita notificaciones por correo.'::text),
        ('notifications.in_app.enabled'::citext,     'notifications'::varchar,'true'::jsonb,                   'BOOLEAN'::varchar, true,  'Habilita notificaciones internas.'::text),
        ('security.password_expiration_days'::citext,'security'::varchar,     '90'::jsonb,                     'NUMBER'::varchar,  false, 'Días de vigencia de contraseña.'::text),
        ('security.max_login_attempts'::citext,      'security'::varchar,     '5'::jsonb,                      'NUMBER'::varchar,  false, 'Intentos fallidos antes de bloqueo.'::text),
        ('security.lockout_minutes'::citext,         'security'::varchar,     '15'::jsonb,                     'NUMBER'::varchar,  false, 'Duración del bloqueo temporal.'::text),
        ('mobile.enabled'::citext,                   'mobile'::varchar,       'true'::jsonb,                   'BOOLEAN'::varchar, true,  'Habilita la experiencia mobile.'::text)
) AS values_to_apply(
    key,
    group_name,
    value,
    value_type,
    is_public,
    description
)
WHERE t.code = 'DEMO'
ON CONFLICT (tenant_id, key)
DO UPDATE SET
    group_name = EXCLUDED.group_name,
    value = EXCLUDED.value,
    value_type = EXCLUDED.value_type,
    is_public = EXCLUDED.is_public,
    is_encrypted = false,
    description = EXCLUDED.description,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

-- =============================================================================
-- 13. MENÚS BASE
-- =============================================================================

-- Raíces.
INSERT INTO app.menus (
    id,
    tenant_id,
    parent_id,
    code,
    label,
    description,
    route,
    icon,
    sort_order,
    platform,
    required_permission_id,
    required_feature_code,
    is_visible,
    is_active,
    metadata,
    created_by,
    updated_by
)
SELECT
    values_to_apply.id::uuid,
    NULL,
    NULL,
    values_to_apply.code,
    values_to_apply.label,
    values_to_apply.description,
    values_to_apply.route,
    values_to_apply.icon,
    values_to_apply.sort_order,
    values_to_apply.platform,
    p.id,
    values_to_apply.required_feature_code,
    true,
    true,
    '{"seed": true}'::jsonb,
    u.id,
    u.id
FROM (
    VALUES
        ('60000000-0000-4000-8000-000000000001', 'platform.dashboard'::citext,      'Dashboard plataforma'::varchar, 'Indicadores globales.'::text,               '/platform'::varchar,       'LayoutDashboard'::varchar, 10, 'WEB'::varchar,  'dashboard.read'::citext,      NULL::citext),
        ('60000000-0000-4000-8000-000000000002', 'platform.administration'::citext, 'Administración'::varchar,       'Administración de la plataforma.'::text,    NULL::varchar,              'Shield'::varchar,          20, 'WEB'::varchar,  NULL::citext,                  NULL::citext),
        ('60000000-0000-4000-8000-000000000010', 'tenant.dashboard'::citext,        'Inicio'::varchar,               'Dashboard del tenant.'::text,               '/app'::varchar,            'Home'::varchar,            10, 'BOTH'::varchar, 'dashboard.read'::citext,      NULL::citext),
        ('60000000-0000-4000-8000-000000000011', 'tenant.security'::citext,         'Seguridad'::varchar,            'Usuarios, roles y accesos.'::text,           NULL::varchar,              'ShieldCheck'::varchar,     20, 'BOTH'::varchar, NULL::citext,                  NULL::citext),
        ('60000000-0000-4000-8000-000000000012', 'tenant.management'::citext,       'Administración'::varchar,       'Configuración general del tenant.'::text,    NULL::varchar,              'Settings'::varchar,        30, 'BOTH'::varchar, NULL::citext,                  NULL::citext),
        ('60000000-0000-4000-8000-000000000013', 'tenant.integrations'::citext,     'Integraciones'::varchar,        'Integraciones y credenciales.'::text,        NULL::varchar,              'Plug'::varchar,            40, 'WEB'::varchar,  NULL::citext,                  'api.access'::citext),
        ('60000000-0000-4000-8000-000000000014', 'tenant.profile'::citext,          'Mi perfil'::varchar,            'Perfil del usuario actual.'::text,           '/app/profile'::varchar,    'UserRound'::varchar,       90, 'BOTH'::varchar, 'profile.read'::citext,        NULL::citext),
        ('60000000-0000-4000-8000-000000000015', 'tenant.notifications'::citext,    'Notificaciones'::varchar,       'Centro de notificaciones.'::text,            '/app/notifications'::varchar,'Bell'::varchar,          80, 'BOTH'::varchar, 'notifications.read'::citext,  'notifications.enabled'::citext)
) AS values_to_apply(
    id,
    code,
    label,
    description,
    route,
    icon,
    sort_order,
    platform,
    permission_code,
    required_feature_code
)
LEFT JOIN app.permissions p
    ON p.code = values_to_apply.permission_code
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
ON CONFLICT DO NOTHING;

-- Hijos de administración de plataforma.
INSERT INTO app.menus (
    id,
    tenant_id,
    parent_id,
    code,
    label,
    description,
    route,
    icon,
    sort_order,
    platform,
    required_permission_id,
    is_visible,
    is_active,
    metadata,
    created_by,
    updated_by
)
SELECT
    values_to_apply.id::uuid,
    NULL,
    parent_menu.id,
    values_to_apply.code,
    values_to_apply.label,
    values_to_apply.description,
    values_to_apply.route,
    values_to_apply.icon,
    values_to_apply.sort_order,
    'WEB',
    p.id,
    true,
    true,
    '{"seed": true}'::jsonb,
    u.id,
    u.id
FROM (
    VALUES
        ('60000000-0000-4000-8000-000000000003', 'platform.tenants'::citext,  'Tenants'::varchar,   'Gestión de tenants.'::text,  '/platform/tenants'::varchar,  'Building2'::varchar, 10, 'tenants.read'::citext),
        ('60000000-0000-4000-8000-000000000004', 'platform.plans'::citext,    'Planes'::varchar,    'Gestión de planes.'::text,   '/platform/plans'::varchar,    'BadgeDollarSign'::varchar, 20, 'plans.read'::citext),
        ('60000000-0000-4000-8000-000000000005', 'platform.features'::citext, 'Features'::varchar,  'Catálogo de features.'::text,'/platform/features'::varchar, 'Blocks'::varchar, 30, 'features.read'::citext),
        ('60000000-0000-4000-8000-000000000006', 'platform.audit'::citext,    'Auditoría'::varchar, 'Auditoría global.'::text,     '/platform/audit'::varchar,    'ScrollText'::varchar, 40, 'audit.read'::citext)
) AS values_to_apply(
    id,
    code,
    label,
    description,
    route,
    icon,
    sort_order,
    permission_code
)
JOIN app.menus parent_menu
    ON parent_menu.code = 'platform.administration'
   AND parent_menu.tenant_id IS NULL
LEFT JOIN app.permissions p
    ON p.code = values_to_apply.permission_code
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
ON CONFLICT DO NOTHING;

-- Hijos de seguridad.
INSERT INTO app.menus (
    id,
    tenant_id,
    parent_id,
    code,
    label,
    description,
    route,
    icon,
    sort_order,
    platform,
    required_permission_id,
    required_feature_code,
    is_visible,
    is_active,
    metadata,
    created_by,
    updated_by
)
SELECT
    values_to_apply.id::uuid,
    NULL,
    parent_menu.id,
    values_to_apply.code,
    values_to_apply.label,
    values_to_apply.description,
    values_to_apply.route,
    values_to_apply.icon,
    values_to_apply.sort_order,
    values_to_apply.platform,
    p.id,
    values_to_apply.required_feature_code,
    true,
    true,
    '{"seed": true}'::jsonb,
    u.id,
    u.id
FROM (
    VALUES
        ('60000000-0000-4000-8000-000000000020', 'tenant.users'::citext, 'Usuarios'::varchar, 'Gestión de usuarios.'::text, '/app/security/users'::varchar, 'Users'::varchar, 10, 'BOTH'::varchar, 'users.read'::citext, NULL::citext),
        ('60000000-0000-4000-8000-000000000021', 'tenant.roles'::citext, 'Roles'::varchar,    'Gestión de roles.'::text,    '/app/security/roles'::varchar, 'KeyRound'::varchar, 20, 'BOTH'::varchar, 'roles.read'::citext, 'custom_roles.enabled'::citext),
        ('60000000-0000-4000-8000-000000000022', 'tenant.menus'::citext, 'Menús'::varchar,    'Configuración de menús.'::text,'/app/security/menus'::varchar,'Menu'::varchar, 30, 'WEB'::varchar, 'menus.read'::citext, 'custom_roles.enabled'::citext),
        ('60000000-0000-4000-8000-000000000023', 'tenant.sessions'::citext, 'Sesiones'::varchar,'Sesiones activas.'::text, '/app/security/sessions'::varchar,'MonitorSmartphone'::varchar,40,'WEB'::varchar,'sessions.read'::citext,NULL::citext)
) AS values_to_apply(
    id,
    code,
    label,
    description,
    route,
    icon,
    sort_order,
    platform,
    permission_code,
    required_feature_code
)
JOIN app.menus parent_menu
    ON parent_menu.code = 'tenant.security'
   AND parent_menu.tenant_id IS NULL
LEFT JOIN app.permissions p
    ON p.code = values_to_apply.permission_code
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
ON CONFLICT DO NOTHING;

-- Hijos de administración del tenant.
INSERT INTO app.menus (
    id,
    tenant_id,
    parent_id,
    code,
    label,
    description,
    route,
    icon,
    sort_order,
    platform,
    required_permission_id,
    required_feature_code,
    is_visible,
    is_active,
    metadata,
    created_by,
    updated_by
)
SELECT
    values_to_apply.id::uuid,
    NULL,
    parent_menu.id,
    values_to_apply.code,
    values_to_apply.label,
    values_to_apply.description,
    values_to_apply.route,
    values_to_apply.icon,
    values_to_apply.sort_order,
    values_to_apply.platform,
    p.id,
    values_to_apply.required_feature_code,
    true,
    true,
    '{"seed": true}'::jsonb,
    u.id,
    u.id
FROM (
    VALUES
        ('60000000-0000-4000-8000-000000000030', 'tenant.subscription'::citext, 'Plan y suscripción'::varchar, 'Consulta del plan actual.'::text, '/app/subscription'::varchar, 'CreditCard'::varchar, 10, 'WEB'::varchar,  'subscriptions.read'::citext, NULL::citext),
        ('60000000-0000-4000-8000-000000000031', 'tenant.settings'::citext,     'Configuración'::varchar,      'Configuración del tenant.'::text,'/app/settings'::varchar,     'Settings2'::varchar, 20, 'BOTH'::varchar, 'settings.read'::citext, NULL::citext),
        ('60000000-0000-4000-8000-000000000032', 'tenant.audit'::citext,        'Auditoría'::varchar,          'Auditoría del tenant.'::text,  '/app/audit'::varchar,        'ScrollText'::varchar, 30, 'WEB'::varchar,  'audit.read'::citext, 'audit.enabled'::citext)
) AS values_to_apply(
    id,
    code,
    label,
    description,
    route,
    icon,
    sort_order,
    platform,
    permission_code,
    required_feature_code
)
JOIN app.menus parent_menu
    ON parent_menu.code = 'tenant.management'
   AND parent_menu.tenant_id IS NULL
LEFT JOIN app.permissions p
    ON p.code = values_to_apply.permission_code
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
ON CONFLICT DO NOTHING;

-- Hijos de integraciones.
INSERT INTO app.menus (
    id,
    tenant_id,
    parent_id,
    code,
    label,
    description,
    route,
    icon,
    sort_order,
    platform,
    required_permission_id,
    required_feature_code,
    is_visible,
    is_active,
    metadata,
    created_by,
    updated_by
)
SELECT
    values_to_apply.id::uuid,
    NULL,
    parent_menu.id,
    values_to_apply.code,
    values_to_apply.label,
    values_to_apply.description,
    values_to_apply.route,
    values_to_apply.icon,
    values_to_apply.sort_order,
    'WEB',
    p.id,
    values_to_apply.required_feature_code,
    true,
    true,
    '{"seed": true}'::jsonb,
    u.id,
    u.id
FROM (
    VALUES
        ('60000000-0000-4000-8000-000000000040', 'tenant.api_keys'::citext, 'API keys'::varchar, 'Credenciales de integración.'::text, '/app/integrations/api-keys'::varchar, 'KeySquare'::varchar, 10, 'api_keys.read'::citext, 'api_keys.enabled'::citext),
        ('60000000-0000-4000-8000-000000000041', 'tenant.webhooks'::citext, 'Webhooks'::varchar, 'Eventos salientes.'::text, '/app/integrations/webhooks'::varchar, 'Webhook'::varchar, 20, 'webhooks.read'::citext, 'webhooks.enabled'::citext)
) AS values_to_apply(
    id,
    code,
    label,
    description,
    route,
    icon,
    sort_order,
    permission_code,
    required_feature_code
)
JOIN app.menus parent_menu
    ON parent_menu.code = 'tenant.integrations'
   AND parent_menu.tenant_id IS NULL
LEFT JOIN app.permissions p
    ON p.code = values_to_apply.permission_code
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
ON CONFLICT DO NOTHING;

-- Actualizar propiedades editables de los menús ya existentes.
WITH menu_values(code, label, route, icon, sort_order, platform) AS (
    VALUES
        ('platform.dashboard'::citext,      'Dashboard plataforma'::varchar, '/platform'::varchar,                  'LayoutDashboard'::varchar, 10, 'WEB'::varchar),
        ('platform.administration'::citext, 'Administración'::varchar,       NULL::varchar,                         'Shield'::varchar,          20, 'WEB'::varchar),
        ('platform.tenants'::citext,        'Tenants'::varchar,              '/platform/tenants'::varchar,          'Building2'::varchar,       10, 'WEB'::varchar),
        ('platform.plans'::citext,          'Planes'::varchar,               '/platform/plans'::varchar,            'BadgeDollarSign'::varchar, 20, 'WEB'::varchar),
        ('platform.features'::citext,       'Features'::varchar,             '/platform/features'::varchar,         'Blocks'::varchar,          30, 'WEB'::varchar),
        ('platform.audit'::citext,          'Auditoría'::varchar,            '/platform/audit'::varchar,            'ScrollText'::varchar,      40, 'WEB'::varchar),
        ('tenant.dashboard'::citext,        'Inicio'::varchar,               '/app'::varchar,                       'Home'::varchar,            10, 'BOTH'::varchar),
        ('tenant.security'::citext,         'Seguridad'::varchar,            NULL::varchar,                         'ShieldCheck'::varchar,     20, 'BOTH'::varchar),
        ('tenant.management'::citext,       'Administración'::varchar,       NULL::varchar,                         'Settings'::varchar,        30, 'BOTH'::varchar),
        ('tenant.integrations'::citext,     'Integraciones'::varchar,        NULL::varchar,                         'Plug'::varchar,            40, 'WEB'::varchar),
        ('tenant.profile'::citext,          'Mi perfil'::varchar,            '/app/profile'::varchar,               'UserRound'::varchar,       90, 'BOTH'::varchar),
        ('tenant.notifications'::citext,    'Notificaciones'::varchar,       '/app/notifications'::varchar,         'Bell'::varchar,            80, 'BOTH'::varchar),
        ('tenant.users'::citext,            'Usuarios'::varchar,             '/app/security/users'::varchar,        'Users'::varchar,           10, 'BOTH'::varchar),
        ('tenant.roles'::citext,            'Roles'::varchar,                '/app/security/roles'::varchar,        'KeyRound'::varchar,        20, 'BOTH'::varchar),
        ('tenant.menus'::citext,            'Menús'::varchar,                '/app/security/menus'::varchar,        'Menu'::varchar,            30, 'WEB'::varchar),
        ('tenant.sessions'::citext,         'Sesiones'::varchar,             '/app/security/sessions'::varchar,     'MonitorSmartphone'::varchar,40,'WEB'::varchar),
        ('tenant.subscription'::citext,     'Plan y suscripción'::varchar,   '/app/subscription'::varchar,          'CreditCard'::varchar,      10, 'WEB'::varchar),
        ('tenant.settings'::citext,         'Configuración'::varchar,        '/app/settings'::varchar,              'Settings2'::varchar,       20, 'BOTH'::varchar),
        ('tenant.audit'::citext,            'Auditoría'::varchar,            '/app/audit'::varchar,                 'ScrollText'::varchar,      30, 'WEB'::varchar),
        ('tenant.api_keys'::citext,         'API keys'::varchar,             '/app/integrations/api-keys'::varchar, 'KeySquare'::varchar,       10, 'WEB'::varchar),
        ('tenant.webhooks'::citext,         'Webhooks'::varchar,             '/app/integrations/webhooks'::varchar, 'Webhook'::varchar,         20, 'WEB'::varchar)
)
UPDATE app.menus m
SET
    label = mv.label,
    route = mv.route,
    icon = mv.icon,
    sort_order = mv.sort_order,
    platform = mv.platform,
    is_visible = true,
    is_active = true,
    deleted_at = NULL,
    metadata = m.metadata || '{"seed": true}'::jsonb,
    updated_at = now()
FROM menu_values mv
WHERE m.tenant_id IS NULL
  AND m.code = mv.code;

-- =============================================================================
-- 14. MENÚS POR ROL
-- =============================================================================

-- Superadmin: todos los menús globales.
INSERT INTO app.role_menus (
    role_id,
    menu_id,
    is_visible,
    granted_by
)
SELECT
    r.id,
    m.id,
    true,
    u.id
FROM app.roles r
CROSS JOIN app.menus m
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
WHERE r.tenant_id IS NULL
  AND r.code = 'SUPER_ADMIN'
  AND m.tenant_id IS NULL
  AND m.deleted_at IS NULL
  AND m.is_active = true
ON CONFLICT (role_id, menu_id)
DO UPDATE SET
    is_visible = true;

-- Administrador del tenant: todos los menús tenant.
INSERT INTO app.role_menus (
    role_id,
    menu_id,
    is_visible,
    granted_by
)
SELECT
    r.id,
    m.id,
    true,
    u.id
FROM app.roles r
JOIN app.tenants t
    ON t.id = r.tenant_id
CROSS JOIN app.menus m
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
WHERE t.code = 'DEMO'
  AND r.code = 'TENANT_ADMIN'
  AND m.tenant_id IS NULL
  AND m.code LIKE 'tenant.%'
  AND m.deleted_at IS NULL
  AND m.is_active = true
ON CONFLICT (role_id, menu_id)
DO UPDATE SET
    is_visible = true;

-- Usuario estándar: menú mínimo.
INSERT INTO app.role_menus (
    role_id,
    menu_id,
    is_visible,
    granted_by
)
SELECT
    r.id,
    m.id,
    true,
    u.id
FROM app.roles r
JOIN app.tenants t
    ON t.id = r.tenant_id
JOIN app.menus m
    ON m.code IN (
        'tenant.dashboard',
        'tenant.profile',
        'tenant.notifications'
    )
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
WHERE t.code = 'DEMO'
  AND r.code = 'TENANT_USER'
  AND m.tenant_id IS NULL
ON CONFLICT (role_id, menu_id)
DO UPDATE SET
    is_visible = true;

-- =============================================================================
-- 15. NOTIFICACIONES DE BIENVENIDA
-- =============================================================================

INSERT INTO app.notifications (
    id,
    tenant_id,
    recipient_user_id,
    type,
    title,
    body,
    data,
    priority
)
SELECT
    '90000000-0000-4000-8000-000000000001',
    t.id,
    u.id,
    'WELCOME',
    'Bienvenido a BaseForge Demo',
    'El tenant de demostración fue configurado correctamente.',
    '{"route": "/app", "seed": true}'::jsonb,
    'NORMAL'
FROM app.tenants t
JOIN app.platform_users u
    ON u.email = 'admin@demo.baseforge.local'
WHERE t.code = 'DEMO'
ON CONFLICT (id)
DO NOTHING;

INSERT INTO app.notifications (
    id,
    tenant_id,
    recipient_user_id,
    type,
    title,
    body,
    data,
    priority
)
SELECT
    '90000000-0000-4000-8000-000000000002',
    t.id,
    u.id,
    'WELCOME',
    'Bienvenido a BaseForge Demo',
    'Tu cuenta de usuario estándar está lista.',
    '{"route": "/app/profile", "seed": true}'::jsonb,
    'NORMAL'
FROM app.tenants t
JOIN app.platform_users u
    ON u.email = 'user@demo.baseforge.local'
WHERE t.code = 'DEMO'
ON CONFLICT (id)
DO NOTHING;

-- =============================================================================
-- 16. AUDITORÍA DEL SEED
-- =============================================================================

INSERT INTO app.audit_logs (
    id,
    tenant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    result,
    after_data,
    metadata,
    trace_id
)
SELECT
    '80000000-0000-4000-8000-000000000001',
    t.id,
    u.id,
    'seed.initialized',
    'tenant',
    t.id::text,
    'SUCCESS',
    jsonb_build_object(
        'tenantCode', t.code,
        'plan', 'PRO',
        'users', 2
    ),
    '{"seed": true, "script": "002_baseforge_seed_data.sql"}'::jsonb,
    '80000000-0000-4000-8000-000000000002'
FROM app.tenants t
JOIN app.platform_users u
    ON u.email = 'superadmin@baseforge.local'
WHERE t.code = 'DEMO'
ON CONFLICT (id)
DO NOTHING;

-- =============================================================================
-- 17. VALIDACIONES DEL SEED
-- =============================================================================

DO $$
DECLARE
    v_user_count integer;
    v_tenant_count integer;
    v_permission_count integer;
    v_role_count integer;
    v_menu_count integer;
    v_subscription_count integer;
BEGIN
    SELECT count(*)
    INTO v_user_count
    FROM app.platform_users
    WHERE email IN (
        'superadmin@baseforge.local',
        'admin@demo.baseforge.local',
        'user@demo.baseforge.local'
    )
      AND deleted_at IS NULL;

    SELECT count(*)
    INTO v_tenant_count
    FROM app.tenants
    WHERE code = 'DEMO'
      AND deleted_at IS NULL;

    SELECT count(*)
    INTO v_permission_count
    FROM app.permissions;

    SELECT count(*)
    INTO v_role_count
    FROM app.roles r
    WHERE (
        r.tenant_id IS NULL
        AND r.code = 'SUPER_ADMIN'
    )
    OR (
        r.tenant_id = (
            SELECT id
            FROM app.tenants
            WHERE code = 'DEMO'
        )
        AND r.code IN ('TENANT_ADMIN', 'TENANT_USER')
    );

    SELECT count(*)
    INTO v_menu_count
    FROM app.menus
    WHERE tenant_id IS NULL
      AND deleted_at IS NULL
      AND is_active = true;

    SELECT count(*)
    INTO v_subscription_count
    FROM app.subscriptions s
    JOIN app.tenants t
        ON t.id = s.tenant_id
    WHERE t.code = 'DEMO'
      AND s.status = 'ACTIVE'
      AND s.deleted_at IS NULL;

    IF v_user_count <> 3 THEN
        RAISE EXCEPTION
            'Seed incompleto: se esperaban 3 usuarios base y se encontraron %',
            v_user_count;
    END IF;

    IF v_tenant_count <> 1 THEN
        RAISE EXCEPTION
            'Seed incompleto: no se creó correctamente el tenant DEMO';
    END IF;

    IF v_permission_count < 46 THEN
        RAISE EXCEPTION
            'Seed incompleto: se esperaban al menos 46 permisos y se encontraron %',
            v_permission_count;
    END IF;

    IF v_role_count <> 3 THEN
        RAISE EXCEPTION
            'Seed incompleto: se esperaban 3 roles base y se encontraron %',
            v_role_count;
    END IF;

    IF v_menu_count < 20 THEN
        RAISE EXCEPTION
            'Seed incompleto: se esperaban al menos 20 menús y se encontraron %',
            v_menu_count;
    END IF;

    IF v_subscription_count <> 1 THEN
        RAISE EXCEPTION
            'Seed incompleto: el tenant DEMO debe tener una suscripción activa';
    END IF;
END;
$$;

COMMIT;

-- =============================================================================
-- CONSULTAS DE VERIFICACIÓN
-- =============================================================================

SELECT
    u.email,
    u.display_name,
    u.status,
    u.must_change_password
FROM app.platform_users u
WHERE u.email IN (
    'superadmin@baseforge.local',
    'admin@demo.baseforge.local',
    'user@demo.baseforge.local'
)
ORDER BY u.email;

SELECT
    t.code AS tenant_code,
    t.display_name AS tenant,
    p.code AS plan_code,
    s.status AS subscription_status,
    s.current_period_end
FROM app.tenants t
JOIN app.subscriptions s
    ON s.tenant_id = t.id
JOIN app.plans p
    ON p.id = s.plan_id
WHERE t.code = 'DEMO'
  AND s.deleted_at IS NULL;

SELECT
    r.code AS role_code,
    count(DISTINCT rp.permission_id) AS permission_count,
    count(DISTINCT rm.menu_id) AS menu_count
FROM app.roles r
LEFT JOIN app.role_permissions rp
    ON rp.role_id = r.id
LEFT JOIN app.role_menus rm
    ON rm.role_id = r.id
WHERE r.code IN ('SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_USER')
GROUP BY r.id, r.code
ORDER BY r.code;

-- =============================================================================
-- RESTABLECIMIENTO MANUAL DE CONTRASEÑAS DE DESARROLLO
--
-- Descomentar únicamente si se necesita restaurar las credenciales conocidas.
--
-- UPDATE app.platform_users
-- SET
--     password_hash = crypt(
--         CASE email
--             WHEN 'superadmin@baseforge.local'
--                 THEN 'ChangeMe.SuperAdmin.2026!'
--             WHEN 'admin@demo.baseforge.local'
--                 THEN 'ChangeMe.TenantAdmin.2026!'
--             WHEN 'user@demo.baseforge.local'
--                 THEN 'ChangeMe.TenantUser.2026!'
--         END,
--         gen_salt('bf', 12)
--     ),
--     must_change_password = true,
--     password_changed_at = now(),
--     token_version = token_version + 1,
--     updated_at = now()
-- WHERE email IN (
--     'superadmin@baseforge.local',
--     'admin@demo.baseforge.local',
--     'user@demo.baseforge.local'
-- );
-- =============================================================================
