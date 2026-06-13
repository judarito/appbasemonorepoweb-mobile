-- =============================================================================
-- BaseForge SaaS
-- Migración inicial PostgreSQL
-- Versión: 001
-- Fecha: 2026-06-13
--
-- Incluye:
--   - Usuarios de plataforma
--   - Tenants y membresías
--   - Roles, permisos y menús
--   - Planes, features, límites y suscripciones
--   - Configuración por tenant
--   - Sesiones y tokens
--   - Auditoría y notificaciones
--   - Archivos, API keys y webhooks
--   - Índices, triggers y políticas RLS
--
-- Requisitos:
--   - PostgreSQL 15 o superior recomendado
--   - Ejecutar con un usuario autorizado para crear extensiones y esquemas
--
-- IMPORTANTE:
--   La aplicación debe establecer el contexto del tenant dentro de cada
--   transacción usando:
--
--     SELECT app.set_request_context(
--       '<tenant-uuid>',
--       '<user-uuid>',
--       false
--     );
--
--   Para operaciones de superadministrador:
--
--     SELECT app.set_request_context(NULL, '<user-uuid>', true);
--
--   El usuario de conexión de la aplicación NO debería ser propietario de las
--   tablas, porque el propietario puede omitir Row Level Security.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS app;

SET search_path TO app, public;

-- =============================================================================
-- FUNCIONES COMUNES
-- =============================================================================

CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        NULLIF(current_setting('app.is_superadmin', true), '')::boolean,
        false
    );
$$;

CREATE OR REPLACE FUNCTION app.set_request_context(
    p_tenant_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_is_superadmin boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config(
        'app.current_tenant_id',
        COALESCE(p_tenant_id::text, ''),
        true
    );

    PERFORM set_config(
        'app.current_user_id',
        COALESCE(p_user_id::text, ''),
        true
    );

    PERFORM set_config(
        'app.is_superadmin',
        COALESCE(p_is_superadmin, false)::text,
        true
    );
END;
$$;

-- =============================================================================
-- USUARIOS DE PLATAFORMA
-- =============================================================================

CREATE TABLE app.platform_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email citext NOT NULL,
    password_hash text NOT NULL,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    display_name varchar(200),
    phone varchar(40),
    status varchar(30) NOT NULL DEFAULT 'ACTIVE',
    locale varchar(20) NOT NULL DEFAULT 'es-CO',
    timezone varchar(100) NOT NULL DEFAULT 'America/Bogota',
    email_verified_at timestamptz,
    password_changed_at timestamptz NOT NULL DEFAULT now(),
    must_change_password boolean NOT NULL DEFAULT false,
    failed_login_attempts integer NOT NULL DEFAULT 0,
    locked_until timestamptz,
    token_version integer NOT NULL DEFAULT 1,
    last_login_at timestamptz,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT uq_platform_users_email UNIQUE (email),
    CONSTRAINT ck_platform_users_status
        CHECK (status IN ('INVITED', 'ACTIVE', 'LOCKED', 'SUSPENDED', 'DISABLED')),
    CONSTRAINT ck_platform_users_failed_login_attempts
        CHECK (failed_login_attempts >= 0),
    CONSTRAINT ck_platform_users_token_version
        CHECK (token_version >= 1)
);

CREATE INDEX ix_platform_users_status
    ON app.platform_users (status)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_platform_users_created_at
    ON app.platform_users (created_at DESC);

-- =============================================================================
-- TENANTS Y MEMBRESÍAS
-- =============================================================================

CREATE TABLE app.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code citext NOT NULL,
    slug citext NOT NULL,
    legal_name varchar(250),
    display_name varchar(200) NOT NULL,
    tax_id varchar(60),
    country_code char(2) NOT NULL DEFAULT 'CO',
    currency_code char(3) NOT NULL DEFAULT 'COP',
    timezone varchar(100) NOT NULL DEFAULT 'America/Bogota',
    locale varchar(20) NOT NULL DEFAULT 'es-CO',
    status varchar(30) NOT NULL DEFAULT 'ACTIVE',
    logo_url text,
    primary_color varchar(20),
    support_email citext,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,

    CONSTRAINT uq_tenants_code UNIQUE (code),
    CONSTRAINT uq_tenants_slug UNIQUE (slug),
    CONSTRAINT ck_tenants_status
        CHECK (status IN ('PENDING', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED', 'ARCHIVED')),
    CONSTRAINT ck_tenants_country_code
        CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT ck_tenants_currency_code
        CHECK (currency_code ~ '^[A-Z]{3}$')
);

CREATE INDEX ix_tenants_status
    ON app.tenants (status)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_tenants_tax_id
    ON app.tenants (tax_id)
    WHERE tax_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE app.tenant_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app.platform_users(id) ON DELETE CASCADE,
    status varchar(30) NOT NULL DEFAULT 'ACTIVE',
    is_owner boolean NOT NULL DEFAULT false,
    joined_at timestamptz,
    last_access_at timestamptz,
    invited_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,

    CONSTRAINT uq_tenant_users_tenant_user UNIQUE (tenant_id, user_id),
    CONSTRAINT ck_tenant_users_status
        CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED'))
);

CREATE INDEX ix_tenant_users_user
    ON app.tenant_users (user_id, status)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_tenant_users_tenant_status
    ON app.tenant_users (tenant_id, status)
    WHERE deleted_at IS NULL;

-- =============================================================================
-- PERMISOS Y ROLES
-- =============================================================================

CREATE TABLE app.permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code citext NOT NULL,
    resource varchar(100) NOT NULL,
    action varchar(100) NOT NULL,
    name varchar(150) NOT NULL,
    description text,
    scope varchar(20) NOT NULL DEFAULT 'TENANT',
    is_system boolean NOT NULL DEFAULT true,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_permissions_code UNIQUE (code),
    CONSTRAINT uq_permissions_resource_action UNIQUE (resource, action),
    CONSTRAINT ck_permissions_scope
        CHECK (scope IN ('PLATFORM', 'TENANT', 'BOTH'))
);

CREATE INDEX ix_permissions_resource
    ON app.permissions (resource, action);

CREATE TABLE app.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES app.tenants(id) ON DELETE CASCADE,
    code citext NOT NULL,
    name varchar(150) NOT NULL,
    description text,
    scope varchar(20) NOT NULL DEFAULT 'TENANT',
    is_system boolean NOT NULL DEFAULT false,
    is_default boolean NOT NULL DEFAULT false,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,

    CONSTRAINT ck_roles_scope
        CHECK (scope IN ('PLATFORM', 'TENANT')),
    CONSTRAINT ck_roles_scope_tenant
        CHECK (
            (scope = 'PLATFORM' AND tenant_id IS NULL)
            OR
            (scope = 'TENANT' AND tenant_id IS NOT NULL)
        )
);

CREATE UNIQUE INDEX uq_roles_platform_code
    ON app.roles (code)
    WHERE tenant_id IS NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX uq_roles_tenant_code
    ON app.roles (tenant_id, code)
    WHERE tenant_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX ix_roles_tenant
    ON app.roles (tenant_id, name)
    WHERE deleted_at IS NULL;

CREATE TABLE app.role_permissions (
    role_id uuid NOT NULL REFERENCES app.roles(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES app.permissions(id) ON DELETE CASCADE,
    granted_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX ix_role_permissions_permission
    ON app.role_permissions (permission_id, role_id);

CREATE TABLE app.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES app.tenants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES app.platform_users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES app.roles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    revoked_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_user_roles_platform
    ON app.user_roles (user_id, role_id)
    WHERE tenant_id IS NULL AND revoked_at IS NULL;

CREATE UNIQUE INDEX uq_user_roles_tenant
    ON app.user_roles (tenant_id, user_id, role_id)
    WHERE tenant_id IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX ix_user_roles_user_tenant
    ON app.user_roles (user_id, tenant_id)
    WHERE revoked_at IS NULL;

CREATE INDEX ix_user_roles_role
    ON app.user_roles (role_id)
    WHERE revoked_at IS NULL;

-- =============================================================================
-- PLANES, FEATURES Y SUSCRIPCIONES
-- =============================================================================

CREATE TABLE app.plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code citext NOT NULL,
    name varchar(150) NOT NULL,
    description text,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE',
    billing_cycle varchar(20) NOT NULL DEFAULT 'MONTHLY',
    price numeric(14, 2) NOT NULL DEFAULT 0,
    currency_code char(3) NOT NULL DEFAULT 'COP',
    trial_days integer NOT NULL DEFAULT 0,
    is_public boolean NOT NULL DEFAULT true,
    is_default boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT uq_plans_code UNIQUE (code),
    CONSTRAINT ck_plans_status
        CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
    CONSTRAINT ck_plans_billing_cycle
        CHECK (billing_cycle IN ('FREE', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM')),
    CONSTRAINT ck_plans_price
        CHECK (price >= 0),
    CONSTRAINT ck_plans_trial_days
        CHECK (trial_days >= 0),
    CONSTRAINT ck_plans_currency_code
        CHECK (currency_code ~ '^[A-Z]{3}$')
);

CREATE UNIQUE INDEX uq_plans_single_default
    ON app.plans ((is_default))
    WHERE is_default = true AND deleted_at IS NULL;

CREATE INDEX ix_plans_status_sort
    ON app.plans (status, sort_order)
    WHERE deleted_at IS NULL;

CREATE TABLE app.features (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code citext NOT NULL,
    name varchar(150) NOT NULL,
    description text,
    value_type varchar(20) NOT NULL DEFAULT 'BOOLEAN',
    default_value jsonb,
    is_system boolean NOT NULL DEFAULT true,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_features_code UNIQUE (code),
    CONSTRAINT ck_features_value_type
        CHECK (value_type IN ('BOOLEAN', 'INTEGER', 'DECIMAL', 'STRING', 'JSON'))
);

CREATE TABLE app.plan_features (
    plan_id uuid NOT NULL REFERENCES app.plans(id) ON DELETE CASCADE,
    feature_id uuid NOT NULL REFERENCES app.features(id) ON DELETE CASCADE,
    enabled boolean NOT NULL DEFAULT true,
    value jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (plan_id, feature_id)
);

CREATE INDEX ix_plan_features_feature
    ON app.plan_features (feature_id, plan_id);

CREATE TABLE app.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES app.plans(id) ON DELETE RESTRICT,
    status varchar(30) NOT NULL DEFAULT 'TRIALING',
    billing_cycle varchar(20) NOT NULL DEFAULT 'MONTHLY',
    quantity integer NOT NULL DEFAULT 1,
    currency_code char(3) NOT NULL DEFAULT 'COP',
    unit_price numeric(14, 2) NOT NULL DEFAULT 0,
    starts_at timestamptz NOT NULL DEFAULT now(),
    trial_ends_at timestamptz,
    current_period_start timestamptz,
    current_period_end timestamptz,
    grace_ends_at timestamptz,
    canceled_at timestamptz,
    ended_at timestamptz,
    auto_renew boolean NOT NULL DEFAULT true,
    external_provider varchar(60),
    external_customer_id varchar(200),
    external_subscription_id varchar(200),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT ck_subscriptions_status
        CHECK (
            status IN (
                'TRIALING',
                'ACTIVE',
                'PAST_DUE',
                'GRACE_PERIOD',
                'SUSPENDED',
                'CANCELED',
                'EXPIRED'
            )
        ),
    CONSTRAINT ck_subscriptions_billing_cycle
        CHECK (billing_cycle IN ('FREE', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM')),
    CONSTRAINT ck_subscriptions_quantity
        CHECK (quantity > 0),
    CONSTRAINT ck_subscriptions_unit_price
        CHECK (unit_price >= 0),
    CONSTRAINT ck_subscriptions_currency_code
        CHECK (currency_code ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_subscriptions_period
        CHECK (
            current_period_end IS NULL
            OR current_period_start IS NULL
            OR current_period_end > current_period_start
        )
);

CREATE UNIQUE INDEX uq_subscriptions_one_current
    ON app.subscriptions (tenant_id)
    WHERE
        status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD')
        AND deleted_at IS NULL;

CREATE INDEX ix_subscriptions_tenant_status
    ON app.subscriptions (tenant_id, status)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_subscriptions_period_end
    ON app.subscriptions (current_period_end)
    WHERE
        current_period_end IS NOT NULL
        AND deleted_at IS NULL;

CREATE TABLE app.tenant_features (
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    feature_id uuid NOT NULL REFERENCES app.features(id) ON DELETE CASCADE,
    enabled boolean NOT NULL DEFAULT true,
    value jsonb,
    valid_until timestamptz,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (tenant_id, feature_id)
);

CREATE TABLE app.tenant_limits (
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    metric_key citext NOT NULL,
    limit_value bigint NOT NULL,
    warning_threshold numeric(5, 2) NOT NULL DEFAULT 80,
    reset_period varchar(20) NOT NULL DEFAULT 'NONE',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (tenant_id, metric_key),
    CONSTRAINT ck_tenant_limits_value
        CHECK (limit_value >= -1),
    CONSTRAINT ck_tenant_limits_warning
        CHECK (warning_threshold >= 0 AND warning_threshold <= 100),
    CONSTRAINT ck_tenant_limits_reset_period
        CHECK (reset_period IN ('NONE', 'DAILY', 'MONTHLY', 'YEARLY'))
);

CREATE TABLE app.tenant_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    metric_key citext NOT NULL,
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    used_value bigint NOT NULL DEFAULT 0,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_tenant_usage_period
        UNIQUE (tenant_id, metric_key, period_start, period_end),
    CONSTRAINT ck_tenant_usage_period
        CHECK (period_end > period_start),
    CONSTRAINT ck_tenant_usage_value
        CHECK (used_value >= 0)
);

CREATE INDEX ix_tenant_usage_lookup
    ON app.tenant_usage (tenant_id, metric_key, period_end DESC);

-- =============================================================================
-- CONFIGURACIÓN POR TENANT
-- =============================================================================

CREATE TABLE app.tenant_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    key citext NOT NULL,
    group_name varchar(100) NOT NULL DEFAULT 'general',
    value jsonb NOT NULL,
    value_type varchar(30) NOT NULL DEFAULT 'STRING',
    is_public boolean NOT NULL DEFAULT false,
    is_encrypted boolean NOT NULL DEFAULT false,
    description text,
    updated_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_tenant_settings_key UNIQUE (tenant_id, key),
    CONSTRAINT ck_tenant_settings_value_type
        CHECK (
            value_type IN (
                'STRING',
                'NUMBER',
                'BOOLEAN',
                'JSON',
                'SECRET_REFERENCE'
            )
        ),
    CONSTRAINT ck_tenant_settings_secret_public
        CHECK (NOT (is_public = true AND is_encrypted = true))
);

CREATE INDEX ix_tenant_settings_group
    ON app.tenant_settings (tenant_id, group_name, key);

-- =============================================================================
-- MENÚS DINÁMICOS
-- =============================================================================

CREATE TABLE app.menus (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES app.tenants(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES app.menus(id) ON DELETE CASCADE,
    code citext NOT NULL,
    label varchar(150) NOT NULL,
    description text,
    route varchar(300),
    icon varchar(100),
    sort_order integer NOT NULL DEFAULT 0,
    platform varchar(20) NOT NULL DEFAULT 'BOTH',
    required_permission_id uuid REFERENCES app.permissions(id) ON DELETE SET NULL,
    required_feature_code citext REFERENCES app.features(code) ON UPDATE CASCADE ON DELETE SET NULL,
    is_visible boolean NOT NULL DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT ck_menus_platform
        CHECK (platform IN ('WEB', 'MOBILE', 'BOTH')),
    CONSTRAINT ck_menus_not_own_parent
        CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE UNIQUE INDEX uq_menus_platform_code
    ON app.menus (code, platform)
    WHERE tenant_id IS NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX uq_menus_tenant_code
    ON app.menus (tenant_id, code, platform)
    WHERE tenant_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX ix_menus_tree
    ON app.menus (tenant_id, parent_id, sort_order)
    WHERE deleted_at IS NULL AND is_active = true;

CREATE TABLE app.role_menus (
    role_id uuid NOT NULL REFERENCES app.roles(id) ON DELETE CASCADE,
    menu_id uuid NOT NULL REFERENCES app.menus(id) ON DELETE CASCADE,
    is_visible boolean NOT NULL DEFAULT true,
    granted_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (role_id, menu_id)
);

CREATE INDEX ix_role_menus_menu
    ON app.role_menus (menu_id, role_id);

-- =============================================================================
-- SESIONES, TOKENS Y SEGURIDAD
-- =============================================================================

CREATE TABLE app.user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app.platform_users(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES app.tenants(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE',
    access_channel varchar(20) NOT NULL DEFAULT 'WEB',
    ip_address inet,
    user_agent text,
    device_name varchar(200),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    revoked_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    revoke_reason varchar(250),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ck_user_sessions_status
        CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    CONSTRAINT ck_user_sessions_access_channel
        CHECK (access_channel IN ('WEB', 'MOBILE', 'API')),
    CONSTRAINT ck_user_sessions_expiration
        CHECK (expires_at > created_at)
);

CREATE INDEX ix_user_sessions_user_active
    ON app.user_sessions (user_id, last_seen_at DESC)
    WHERE status = 'ACTIVE';

CREATE INDEX ix_user_sessions_tenant_active
    ON app.user_sessions (tenant_id, last_seen_at DESC)
    WHERE tenant_id IS NOT NULL AND status = 'ACTIVE';

CREATE INDEX ix_user_sessions_expiration
    ON app.user_sessions (expires_at)
    WHERE status = 'ACTIVE';

CREATE TABLE app.refresh_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES app.user_sessions(id) ON DELETE CASCADE,
    family_id uuid NOT NULL DEFAULT gen_random_uuid(),
    parent_token_id uuid REFERENCES app.refresh_tokens(id) ON DELETE SET NULL,
    token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    revoked_at timestamptz,
    reuse_detected_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT ck_refresh_tokens_expiration
        CHECK (expires_at > created_at)
);

CREATE INDEX ix_refresh_tokens_session
    ON app.refresh_tokens (session_id, created_at DESC);

CREATE INDEX ix_refresh_tokens_family
    ON app.refresh_tokens (family_id, created_at DESC);

CREATE INDEX ix_refresh_tokens_active_expiration
    ON app.refresh_tokens (expires_at)
    WHERE consumed_at IS NULL AND revoked_at IS NULL;

CREATE TABLE app.password_reset_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app.platform_users(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    requested_ip inet,
    requested_user_agent text,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_password_reset_tokens_hash UNIQUE (token_hash),
    CONSTRAINT ck_password_reset_tokens_expiration
        CHECK (expires_at > created_at)
);

CREATE INDEX ix_password_reset_tokens_user
    ON app.password_reset_tokens (user_id, created_at DESC);

CREATE INDEX ix_password_reset_tokens_active
    ON app.password_reset_tokens (expires_at)
    WHERE used_at IS NULL;

CREATE TABLE app.email_verification_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES app.platform_users(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_email_verification_tokens_hash UNIQUE (token_hash),
    CONSTRAINT ck_email_verification_tokens_expiration
        CHECK (expires_at > created_at)
);

CREATE INDEX ix_email_verification_tokens_user
    ON app.email_verification_tokens (user_id, created_at DESC);

CREATE TABLE app.login_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES app.tenants(id) ON DELETE SET NULL,
    user_id uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    email citext NOT NULL,
    success boolean NOT NULL,
    failure_reason varchar(100),
    ip_address inet,
    user_agent text,
    occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_login_attempts_email_time
    ON app.login_attempts (email, occurred_at DESC);

CREATE INDEX ix_login_attempts_ip_time
    ON app.login_attempts (ip_address, occurred_at DESC)
    WHERE ip_address IS NOT NULL;

-- =============================================================================
-- AUDITORÍA
-- =============================================================================

CREATE TABLE app.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES app.tenants(id) ON DELETE SET NULL,
    actor_user_id uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    session_id uuid REFERENCES app.user_sessions(id) ON DELETE SET NULL,
    action varchar(150) NOT NULL,
    entity_type varchar(150) NOT NULL,
    entity_id varchar(150),
    result varchar(20) NOT NULL DEFAULT 'SUCCESS',
    before_data jsonb,
    after_data jsonb,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    trace_id uuid,
    occurred_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ck_audit_logs_result
        CHECK (result IN ('SUCCESS', 'FAILURE', 'DENIED'))
);

CREATE INDEX ix_audit_logs_tenant_time
    ON app.audit_logs (tenant_id, occurred_at DESC);

CREATE INDEX ix_audit_logs_actor_time
    ON app.audit_logs (actor_user_id, occurred_at DESC)
    WHERE actor_user_id IS NOT NULL;

CREATE INDEX ix_audit_logs_entity
    ON app.audit_logs (entity_type, entity_id, occurred_at DESC);

CREATE INDEX ix_audit_logs_trace
    ON app.audit_logs (trace_id)
    WHERE trace_id IS NOT NULL;

-- =============================================================================
-- NOTIFICACIONES
-- =============================================================================

CREATE TABLE app.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    recipient_user_id uuid NOT NULL REFERENCES app.platform_users(id) ON DELETE CASCADE,
    type varchar(100) NOT NULL,
    title varchar(250) NOT NULL,
    body text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    priority varchar(20) NOT NULL DEFAULT 'NORMAL',
    read_at timestamptz,
    archived_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ck_notifications_priority
        CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'))
);

CREATE INDEX ix_notifications_recipient_unread
    ON app.notifications (tenant_id, recipient_user_id, created_at DESC)
    WHERE read_at IS NULL AND archived_at IS NULL;

CREATE INDEX ix_notifications_recipient_all
    ON app.notifications (tenant_id, recipient_user_id, created_at DESC);

-- =============================================================================
-- ARCHIVOS
-- =============================================================================

CREATE TABLE app.files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    storage_provider varchar(50) NOT NULL DEFAULT 'LOCAL',
    bucket varchar(150),
    object_key text NOT NULL,
    original_name varchar(500) NOT NULL,
    mime_type varchar(200) NOT NULL,
    size_bytes bigint NOT NULL,
    checksum_sha256 varchar(64),
    visibility varchar(20) NOT NULL DEFAULT 'PRIVATE',
    status varchar(20) NOT NULL DEFAULT 'ACTIVE',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,

    CONSTRAINT uq_files_storage_object UNIQUE (storage_provider, bucket, object_key),
    CONSTRAINT ck_files_size
        CHECK (size_bytes >= 0),
    CONSTRAINT ck_files_visibility
        CHECK (visibility IN ('PRIVATE', 'TENANT', 'PUBLIC')),
    CONSTRAINT ck_files_status
        CHECK (status IN ('PENDING', 'ACTIVE', 'QUARANTINED', 'DELETED'))
);

CREATE INDEX ix_files_tenant_time
    ON app.files (tenant_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_files_checksum
    ON app.files (checksum_sha256)
    WHERE checksum_sha256 IS NOT NULL AND deleted_at IS NULL;

-- =============================================================================
-- API KEYS
-- =============================================================================

CREATE TABLE app.api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    name varchar(150) NOT NULL,
    key_prefix varchar(30) NOT NULL,
    secret_hash text NOT NULL,
    scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
    status varchar(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at timestamptz,
    last_used_at timestamptz,
    last_used_ip inet,
    created_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    revoked_at timestamptz,
    revoked_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_api_keys_prefix UNIQUE (key_prefix),
    CONSTRAINT ck_api_keys_status
        CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED'))
);

CREATE INDEX ix_api_keys_tenant_status
    ON app.api_keys (tenant_id, status);

CREATE INDEX ix_api_keys_expiration
    ON app.api_keys (expires_at)
    WHERE status = 'ACTIVE' AND expires_at IS NOT NULL;

-- =============================================================================
-- WEBHOOKS
-- =============================================================================

CREATE TABLE app.webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    name varchar(150) NOT NULL,
    target_url text NOT NULL,
    secret_hash text NOT NULL,
    events text[] NOT NULL DEFAULT ARRAY[]::text[],
    status varchar(20) NOT NULL DEFAULT 'ACTIVE',
    max_attempts integer NOT NULL DEFAULT 5,
    timeout_seconds integer NOT NULL DEFAULT 15,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES app.platform_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT ck_webhooks_status
        CHECK (status IN ('ACTIVE', 'PAUSED', 'DISABLED')),
    CONSTRAINT ck_webhooks_max_attempts
        CHECK (max_attempts BETWEEN 1 AND 20),
    CONSTRAINT ck_webhooks_timeout
        CHECK (timeout_seconds BETWEEN 1 AND 120),
    CONSTRAINT ck_webhooks_https
        CHECK (target_url ~ '^https://')
);

CREATE UNIQUE INDEX uq_webhooks_tenant_name
    ON app.webhooks (tenant_id, name)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_webhooks_tenant_status
    ON app.webhooks (tenant_id, status)
    WHERE deleted_at IS NULL;

CREATE TABLE app.webhook_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    webhook_id uuid NOT NULL REFERENCES app.webhooks(id) ON DELETE CASCADE,
    event_id uuid NOT NULL DEFAULT gen_random_uuid(),
    event_type varchar(150) NOT NULL,
    payload jsonb NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'PENDING',
    attempt_count integer NOT NULL DEFAULT 0,
    next_attempt_at timestamptz,
    request_headers jsonb,
    response_status integer,
    response_headers jsonb,
    response_body text,
    last_error text,
    delivered_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ck_webhook_deliveries_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'DEAD_LETTER')),
    CONSTRAINT ck_webhook_deliveries_attempts
        CHECK (attempt_count >= 0),
    CONSTRAINT ck_webhook_deliveries_response_status
        CHECK (
            response_status IS NULL
            OR response_status BETWEEN 100 AND 599
        )
);

CREATE INDEX ix_webhook_deliveries_pending
    ON app.webhook_deliveries (status, next_attempt_at, created_at)
    WHERE status IN ('PENDING', 'FAILED');

CREATE INDEX ix_webhook_deliveries_webhook
    ON app.webhook_deliveries (webhook_id, created_at DESC);

CREATE INDEX ix_webhook_deliveries_event
    ON app.webhook_deliveries (event_id);

-- =============================================================================
-- IDEMPOTENCIA PARA OPERACIONES API
-- =============================================================================

CREATE TABLE app.idempotency_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
    key varchar(200) NOT NULL,
    request_hash varchar(64) NOT NULL,
    response_status integer,
    response_body jsonb,
    locked_until timestamptz,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_idempotency_keys_tenant_key UNIQUE (tenant_id, key),
    CONSTRAINT ck_idempotency_keys_status
        CHECK (
            response_status IS NULL
            OR response_status BETWEEN 100 AND 599
        ),
    CONSTRAINT ck_idempotency_keys_expiration
        CHECK (expires_at > created_at)
);

CREATE INDEX ix_idempotency_keys_expiration
    ON app.idempotency_keys (expires_at);

-- =============================================================================
-- TRIGGERS DE UPDATED_AT
-- =============================================================================

CREATE TRIGGER trg_platform_users_updated_at
BEFORE UPDATE ON app.platform_users
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON app.tenants
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_tenant_users_updated_at
BEFORE UPDATE ON app.tenant_users
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_permissions_updated_at
BEFORE UPDATE ON app.permissions
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON app.roles
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON app.plans
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_features_updated_at
BEFORE UPDATE ON app.features
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_plan_features_updated_at
BEFORE UPDATE ON app.plan_features
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON app.subscriptions
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_tenant_features_updated_at
BEFORE UPDATE ON app.tenant_features
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_tenant_limits_updated_at
BEFORE UPDATE ON app.tenant_limits
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_tenant_usage_updated_at
BEFORE UPDATE ON app.tenant_usage
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_tenant_settings_updated_at
BEFORE UPDATE ON app.tenant_settings
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_menus_updated_at
BEFORE UPDATE ON app.menus
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_user_sessions_updated_at
BEFORE UPDATE ON app.user_sessions
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_files_updated_at
BEFORE UPDATE ON app.files
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_webhooks_updated_at
BEFORE UPDATE ON app.webhooks
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TRIGGER trg_webhook_deliveries_updated_at
BEFORE UPDATE ON app.webhook_deliveries
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE app.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.tenant_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.role_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Catálogos globales: cualquier sesión autenticada puede leerlos, pero solo
-- el superadministrador puede modificarlos.

CREATE POLICY tenants_select_policy
ON app.tenants
FOR SELECT
USING (
    app.is_superadmin()
    OR id = app.current_tenant_id()
);

CREATE POLICY tenants_write_policy
ON app.tenants
FOR ALL
USING (app.is_superadmin())
WITH CHECK (app.is_superadmin());

CREATE POLICY permissions_select_policy
ON app.permissions
FOR SELECT
USING (true);

CREATE POLICY permissions_write_policy
ON app.permissions
FOR ALL
USING (app.is_superadmin())
WITH CHECK (app.is_superadmin());

CREATE POLICY plans_select_policy
ON app.plans
FOR SELECT
USING (true);

CREATE POLICY plans_write_policy
ON app.plans
FOR ALL
USING (app.is_superadmin())
WITH CHECK (app.is_superadmin());

CREATE POLICY features_select_policy
ON app.features
FOR SELECT
USING (true);

CREATE POLICY features_write_policy
ON app.features
FOR ALL
USING (app.is_superadmin())
WITH CHECK (app.is_superadmin());

CREATE POLICY plan_features_select_policy
ON app.plan_features
FOR SELECT
USING (true);

CREATE POLICY plan_features_write_policy
ON app.plan_features
FOR ALL
USING (app.is_superadmin())
WITH CHECK (app.is_superadmin());

-- Tablas con tenant_id obligatorio.

CREATE POLICY tenant_users_tenant_isolation
ON app.tenant_users
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY subscriptions_tenant_isolation
ON app.subscriptions
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY tenant_features_tenant_isolation
ON app.tenant_features
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY tenant_limits_tenant_isolation
ON app.tenant_limits
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY tenant_usage_tenant_isolation
ON app.tenant_usage
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY tenant_settings_tenant_isolation
ON app.tenant_settings
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY notifications_tenant_isolation
ON app.notifications
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY files_tenant_isolation
ON app.files
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY api_keys_tenant_isolation
ON app.api_keys
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY webhooks_tenant_isolation
ON app.webhooks
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY webhook_deliveries_tenant_isolation
ON app.webhook_deliveries
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY idempotency_keys_tenant_isolation
ON app.idempotency_keys
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

-- Roles y menús permiten leer registros globales, pero solo el superadmin puede
-- crear o modificar registros globales.

CREATE POLICY roles_select_policy
ON app.roles
FOR SELECT
USING (
    app.is_superadmin()
    OR tenant_id IS NULL
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY roles_write_policy
ON app.roles
FOR ALL
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY menus_select_policy
ON app.menus
FOR SELECT
USING (
    app.is_superadmin()
    OR tenant_id IS NULL
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY menus_write_policy
ON app.menus
FOR ALL
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY role_permissions_select_policy
ON app.role_permissions
FOR SELECT
USING (
    app.is_superadmin()
    OR EXISTS (
        SELECT 1
        FROM app.roles r
        WHERE r.id = role_permissions.role_id
          AND (
              r.tenant_id IS NULL
              OR r.tenant_id = app.current_tenant_id()
          )
    )
);

CREATE POLICY role_permissions_write_policy
ON app.role_permissions
FOR ALL
USING (
    app.is_superadmin()
    OR EXISTS (
        SELECT 1
        FROM app.roles r
        WHERE r.id = role_permissions.role_id
          AND r.tenant_id = app.current_tenant_id()
    )
)
WITH CHECK (
    app.is_superadmin()
    OR EXISTS (
        SELECT 1
        FROM app.roles r
        WHERE r.id = role_permissions.role_id
          AND r.tenant_id = app.current_tenant_id()
    )
);

CREATE POLICY user_roles_select_policy
ON app.user_roles
FOR SELECT
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY user_roles_write_policy
ON app.user_roles
FOR ALL
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY role_menus_select_policy
ON app.role_menus
FOR SELECT
USING (
    app.is_superadmin()
    OR EXISTS (
        SELECT 1
        FROM app.roles r
        WHERE r.id = role_menus.role_id
          AND (
              r.tenant_id IS NULL
              OR r.tenant_id = app.current_tenant_id()
          )
    )
);

CREATE POLICY role_menus_write_policy
ON app.role_menus
FOR ALL
USING (
    app.is_superadmin()
    OR EXISTS (
        SELECT 1
        FROM app.roles r
        WHERE r.id = role_menus.role_id
          AND r.tenant_id = app.current_tenant_id()
    )
)
WITH CHECK (
    app.is_superadmin()
    OR EXISTS (
        SELECT 1
        FROM app.roles r
        WHERE r.id = role_menus.role_id
          AND r.tenant_id = app.current_tenant_id()
    )
);

-- Las sesiones de plataforma pueden tener tenant_id nulo. Un usuario normal
-- solo consulta sesiones del tenant actual y, adicionalmente, sus propias
-- sesiones mediante current_user_id.

CREATE POLICY user_sessions_select_policy
ON app.user_sessions
FOR SELECT
USING (
    app.is_superadmin()
    OR (
        tenant_id = app.current_tenant_id()
        AND (
            user_id = app.current_user_id()
            OR EXISTS (
                SELECT 1
                FROM app.user_roles ur
                JOIN app.role_permissions rp
                  ON rp.role_id = ur.role_id
                JOIN app.permissions p
                  ON p.id = rp.permission_id
                WHERE ur.user_id = app.current_user_id()
                  AND ur.tenant_id = app.current_tenant_id()
                  AND ur.revoked_at IS NULL
                  AND p.code = 'sessions.read'
            )
        )
    )
);

CREATE POLICY user_sessions_write_policy
ON app.user_sessions
FOR ALL
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
)
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY audit_logs_select_policy
ON app.audit_logs
FOR SELECT
USING (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

CREATE POLICY audit_logs_insert_policy
ON app.audit_logs
FOR INSERT
WITH CHECK (
    app.is_superadmin()
    OR tenant_id = app.current_tenant_id()
);

-- =============================================================================
-- COMENTARIOS DE SEGURIDAD Y OPERACIÓN
-- =============================================================================

COMMENT ON SCHEMA app IS
'Esquema principal de BaseForge SaaS. La aplicación debe establecer contexto RLS por transacción.';

COMMENT ON FUNCTION app.set_request_context(uuid, uuid, boolean) IS
'Establece tenant, usuario y bandera de superadmin usando variables locales de la transacción.';

COMMENT ON TABLE app.platform_users IS
'Usuarios globales. Las contraseñas deben almacenarse únicamente como hash seguro.';

COMMENT ON TABLE app.tenant_users IS
'Membresías de usuarios dentro de cada tenant.';

COMMENT ON TABLE app.audit_logs IS
'Auditoría inmutable administrada por la aplicación. Nunca guardar contraseñas, tokens o secretos.';

COMMENT ON COLUMN app.api_keys.secret_hash IS
'Hash del secreto de la API key. El valor original solo debe mostrarse una vez.';

COMMENT ON COLUMN app.webhooks.secret_hash IS
'Hash o referencia segura del secreto utilizado para firmar webhooks.';

COMMENT ON COLUMN app.tenant_settings.value IS
'Valor JSON. Las configuraciones secretas deben guardar una referencia, no el secreto en texto plano.';

-- =============================================================================
-- VALIDACIONES FINALES
-- =============================================================================

DO $$
DECLARE
    table_count integer;
BEGIN
    SELECT count(*)
    INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'app'
      AND table_type = 'BASE TABLE';

    IF table_count < 25 THEN
        RAISE EXCEPTION
            'La migración no creó todas las tablas esperadas. Total: %',
            table_count;
    END IF;
END;
$$;

COMMIT;

-- =============================================================================
-- FIN DE LA MIGRACIÓN
--
-- Próximos archivos recomendados:
--   002_seed_security_catalog.sql
--   003_seed_plans_features.sql
--   004_seed_superadmin.sql
--
-- Ejemplo de ejecución:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f 001_baseforge_initial_migration.sql
-- =============================================================================
