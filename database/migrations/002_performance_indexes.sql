-- =============================================================================
-- BaseForge SaaS
-- Migración: Índices de Rendimiento
-- Versión: 002
-- Fecha: 2026-06-14
-- Descripción: Índices en columnas frecuentemente filtradas para mejorar
--              el rendimiento de login, listados y paginación.
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. platform_users: búsqueda por email (login) — índice único parcial
-- -----------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_users_email
  ON app.platform_users (email)
  WHERE deleted_at IS NULL;

-- Listado de usuarios activos
CREATE INDEX IF NOT EXISTS idx_platform_users_status_active
  ON app.platform_users (status)
  WHERE deleted_at IS NULL;

-- Cursor pagination por created_at
CREATE INDEX IF NOT EXISTS idx_platform_users_created_at
  ON app.platform_users (created_at DESC)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------
-- 2. tenant_users: membresía por tenant y por usuario
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_status
  ON app.tenant_users (tenant_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id
  ON app.tenant_users (user_id)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------
-- 3. user_roles: resolución de permisos por usuario+tenant
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant
  ON app.user_roles (user_id, tenant_id)
  WHERE revoked_at IS NULL;

-- -----------------------------------------------------------------------
-- 4. user_sessions: sesiones activas por usuario
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_status
  ON app.user_sessions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at
  ON app.user_sessions (expires_at)
  WHERE status = 'ACTIVE';

-- -----------------------------------------------------------------------
-- 5. refresh_tokens: búsqueda por hash y detección de fraude por familia
-- -----------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_hash
  ON app.refresh_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id
  ON app.refresh_tokens (family_id);

-- -----------------------------------------------------------------------
-- 6. audit_logs: paginación por tenant + fecha (tabla ilimitada)
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_date
  ON app.audit_logs (tenant_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON app.audit_logs (actor_user_id)
  WHERE actor_user_id IS NOT NULL;

-- -----------------------------------------------------------------------
-- 7. notifications: bandeja por usuario + sin leer
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON app.notifications (recipient_user_id, tenant_id, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON app.notifications (recipient_user_id, tenant_id)
  WHERE read_at IS NULL AND archived_at IS NULL;

-- -----------------------------------------------------------------------
-- 8. files: listado por tenant + estado
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_files_tenant_status
  ON app.files (tenant_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------
-- 9. tenant_settings: lookup de configuración por clave
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tenant_settings_lookup
  ON app.tenant_settings (tenant_id, key);

-- -----------------------------------------------------------------------
-- 10. tenants: cursor pagination
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tenants_created_at
  ON app.tenants (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_status
  ON app.tenants (status)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------
-- 11. roles: lookup por tenant
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id
  ON app.roles (tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------
-- 12. menus: árbol de menús por tenant
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_menus_tenant_id
  ON app.menus (tenant_id, sort_order)
  WHERE deleted_at IS NULL AND is_active = TRUE;
