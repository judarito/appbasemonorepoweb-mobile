-- =============================================================================
-- BaseForge SaaS — Fase 30: EXPLAIN ANALYZE
--
-- Uso:
--   1. Conectarse a la base de datos:
--      psql -U baseforge -d baseforge -f database/scripts/explain-analyze.sql
--
--   2. O desde Docker:
--      docker exec -i baseforge-postgres psql -U baseforge -d baseforge < database/scripts/explain-analyze.sql
--
-- Estos queries ejecutan EXPLAIN ANALYZE sobre las consultas más críticas
-- para identificar oportunidades de optimización (sequential scans, missing
-- indexes, hash joins costosos, etc.)
-- =============================================================================

\echo '══════════════════════════════════════════════════════════════════════'
\echo '  BaseForge SaaS — Diagnóstico de Rendimiento (EXPLAIN ANALYZE)'
\echo '══════════════════════════════════════════════════════════════════════'
\echo ''

-- -----------------------------------------------------------------------
-- 1. LOGIN: Búsqueda de usuario por email
-- -----------------------------------------------------------------------
\echo '▶ 1. LOGIN — Búsqueda por email (debe usar idx_platform_users_email)'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, email, password_hash, status, failed_login_attempts, locked_until,
       token_version, last_login_at, must_change_password
FROM app.platform_users
WHERE email = 'superadmin@baseforge.local'
  AND deleted_at IS NULL;

-- -----------------------------------------------------------------------
-- 2. LOGIN: Consulta de roles del usuario
-- -----------------------------------------------------------------------
\echo '▶ 2. LOGIN — Roles del usuario (debe usar idx_user_roles_user_tenant)'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT r.code, r.name
FROM app.user_roles ur
JOIN app.roles r ON r.id = ur.role_id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000000'
  AND ur.revoked_at IS NULL
  AND r.deleted_at IS NULL;

-- -----------------------------------------------------------------------
-- 3. LISTADO PAGINADO: Usuarios del tenant
-- -----------------------------------------------------------------------
\echo '▶ 3. LISTADO — Usuarios del tenant (paginado)'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT pu.id, pu.email, pu.first_name, pu.last_name, pu.display_name,
       pu.status, pu.last_login_at, pu.created_at
FROM app.platform_users pu
JOIN app.tenant_users tu ON tu.user_id = pu.id
WHERE tu.tenant_id = '00000000-0000-0000-0000-000000000000'
  AND tu.deleted_at IS NULL
  AND pu.deleted_at IS NULL
ORDER BY pu.created_at DESC
LIMIT 20 OFFSET 0;

-- -----------------------------------------------------------------------
-- 4. CONTEO: Total de usuarios del tenant (para paginación)
-- -----------------------------------------------------------------------
\echo '▶ 4. CONTEO — Total usuarios del tenant'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT COUNT(*)
FROM app.platform_users pu
JOIN app.tenant_users tu ON tu.user_id = pu.id
WHERE tu.tenant_id = '00000000-0000-0000-0000-000000000000'
  AND tu.deleted_at IS NULL
  AND pu.deleted_at IS NULL;

-- -----------------------------------------------------------------------
-- 5. LISTADO: Roles del tenant
-- -----------------------------------------------------------------------
\echo '▶ 5. LISTADO — Roles del tenant (paginado)'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, code, name, description, is_default, created_at
FROM app.roles
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- -----------------------------------------------------------------------
-- 6. AUDITORÍA: Logs por tenant + fecha
-- -----------------------------------------------------------------------
\echo '▶ 6. AUDITORÍA — Logs del tenant (paginado por fecha)'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, action, result, entity_type, entity_id, actor_user_id,
       actor_email, ip_address, created_at
FROM app.audit_logs
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
ORDER BY occurred_at DESC
LIMIT 20 OFFSET 0;

-- -----------------------------------------------------------------------
-- 7. FEATURE FLAGS: Resolución para un tenant
-- -----------------------------------------------------------------------
\echo '▶ 7. FEATURES — Feature flags activos del tenant'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT fc.code, fc.value_type, fc.default_value,
       COALESCE(tof.enabled, false) AS override_enabled,
       tof.valid_until
FROM app.features_catalog fc
LEFT JOIN app.tenant_overrides_features tof
  ON tof.feature_id = fc.id
  AND tof.tenant_id = '00000000-0000-0000-0000-000000000000'
  AND (tof.valid_until IS NULL OR tof.valid_until > NOW())
LEFT JOIN app.plan_features pf
  ON pf.feature_id = fc.id
LEFT JOIN app.subscriptions s
  ON s.tenant_id = '00000000-0000-0000-0000-000000000000'
  AND s.status = 'ACTIVE'
LEFT JOIN app.plans p ON p.id = s.plan_id
WHERE fc.is_active = TRUE;

-- -----------------------------------------------------------------------
-- 8. MENÚS: Árbol de menús del tenant según rol
-- -----------------------------------------------------------------------
\echo '▶ 8. MENÚS — Árbol de menús visible para un rol'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT DISTINCT m.id, m.code, m.label, m.route, m.icon, m.parent_id,
       m.sort_order, m.platform
FROM app.menus m
LEFT JOIN app.menu_permissions mp ON mp.menu_id = m.id
LEFT JOIN app.role_permissions rp ON rp.permission_id = mp.permission_id
LEFT JOIN app.user_roles ur ON ur.role_id = rp.role_id
WHERE m.deleted_at IS NULL
  AND m.is_active = TRUE
  AND m.is_visible = TRUE
  AND (mp.permission_id IS NULL OR ur.user_id = '00000000-0000-0000-0000-000000000000')
ORDER BY m.sort_order ASC;

-- -----------------------------------------------------------------------
-- 9. SETTINGS: Configuración del tenant
-- -----------------------------------------------------------------------
\echo '▶ 9. SETTINGS — Configuración del tenant'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT key, value, value_type, is_public, group_name, description
FROM app.tenant_settings
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
  AND deleted_at IS NULL;

-- -----------------------------------------------------------------------
-- 10. SUPERADMIN: Listado de tenants
-- -----------------------------------------------------------------------
\echo '▶ 10. SUPERADMIN — Listado de tenants (paginado)'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, code, slug, display_name, status, created_at
FROM app.tenants
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- -----------------------------------------------------------------------
-- 11. SESIONES ACTIVAS
-- -----------------------------------------------------------------------
\echo '▶ 11. SESIONES — Sesiones activas de un usuario'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, status, expires_at, created_at
FROM app.user_sessions
WHERE user_id = '00000000-0000-0000-0000-000000000000'
  AND status = 'ACTIVE'
  AND expires_at > NOW()
ORDER BY created_at DESC;

-- -----------------------------------------------------------------------
-- 12. REFRESH TOKEN: Búsqueda por hash
-- -----------------------------------------------------------------------
\echo '▶ 12. REFRESH TOKEN — Búsqueda por hash (debe ser unique index scan)'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT id, family_id, user_id, expires_at, revoked_at
FROM app.refresh_tokens
WHERE token_hash = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

-- -----------------------------------------------------------------------
-- 13. SUPERADMIN: Dashboard stats (conteos)
-- -----------------------------------------------------------------------
\echo '▶ 13. DASHBOARD — Conteos para tarjetas de estadísticas'
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT 'tenants' AS entity, COUNT(*) AS total FROM app.tenants WHERE deleted_at IS NULL
UNION ALL
SELECT 'plans', COUNT(*) FROM app.plans WHERE deleted_at IS NULL
UNION ALL
SELECT 'features', COUNT(*) FROM app.features_catalog WHERE is_active = TRUE;

-- -----------------------------------------------------------------------
-- RESUMEN
-- -----------------------------------------------------------------------
\echo ''
\echo '══════════════════════════════════════════════════════════════════════'
\echo '  INSTRUCCIONES:'
\echo '  • Buscar "Seq Scan" en tablas grandes → falta índice'
\echo '  • Buscar "Sort Method: external merge" → falta índice de ordenamiento'
\echo '  • Buscar "actual time" alto (>> expected) → estadísticas desactualizadas'
\echo '  • Ejecutar: ANALYZE; si los tiempos reales son mucho mayores que los estimados'
\echo '══════════════════════════════════════════════════════════════════════'
