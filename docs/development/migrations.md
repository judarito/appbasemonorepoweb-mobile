# Migraciones — BaseForge SaaS

> **BF-3117** — Versión 1.0 — 2026-06-14

---

## Estrategia

- Migraciones SQL generadas por Drizzle Kit
- Versionadas numéricamente: `001`, `002`, etc.
- Aplicadas manualmente en desarrollo
- Automatizadas en CI/CD para staging/production

---

## Comandos

```bash
# Generar migración desde schema de TypeScript
bun run db:generate

# Aplicar migraciones pendientes
bun run db:migrate

# Revertir última migración
bun run db:rollback

# Ver estado
bun run db:status

# Abrir Drizzle Studio (interfaz gráfica)
bun run db:studio
```

---

## Crear una migración

1. Modificar `apps/api/src/database/schema.ts`
2. Ejecutar `bun run db:generate`
3. Revisar el SQL generado en `database/migrations/`
4. Aplicar con `bun run db:migrate`
5. Commitear el schema + migración

---

## Buenas prácticas

1. **Una migración por concepto** (no mezclar cambios no relacionados)
2. **Nunca** modificar migraciones ya aplicadas — crear una nueva
3. **Siempre** revisar el SQL generado antes de aplicar
4. **Probar** en local antes de subir a staging/production
5. **Hacer backup** antes de migrar en producción

---

## Migraciones existentes

| Migración | Descripción |
|---|---|
| `001_baseforge_initial_migration.sql` | Schema inicial completo |
| `002_performance_indexes.sql` | Índices de rendimiento |
