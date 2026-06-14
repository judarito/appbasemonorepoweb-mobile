# Guía de Variables de Entorno — BaseForge SaaS

> **BF-3104** — Versión 1.0 — 2026-06-14

---

## Archivos de entorno

| Archivo | Propósito | ¿En Git? |
|---|---|---|
| `.env.example` | Plantilla con valores de ejemplo | ✅ Sí |
| `.env` | Entorno local | ❌ No |
| `.env.local` | Sobrescrituras locales | ❌ No |
| `.env.production` | Producción (en CI/CD) | ❌ No |

---

## Variables requeridas

### Servidor

| Variable | Descripción | Default |
|---|---|---|
| `NODE_ENV` | Ambiente (`development`, `production`, `test`) | `development` |
| `PORT` | Puerto del servidor HTTP | `3000` |

### Base de datos

| Variable | Descripción | Default |
|---|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL | `postgres://baseforge:baseforge@localhost:5432/baseforge` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de BD | `baseforge` |
| `DB_PASSWORD` | Contraseña de BD | `baseforge` |
| `DB_NAME` | Nombre de la base de datos | `baseforge` |

### Autenticación JWT

| Variable | Descripción | Default |
|---|---|---|
| `JWT_ACCESS_SECRET` | Secreto para firmar tokens de acceso | — |
| `JWT_REFRESH_SECRET` | Secreto para firmar refresh tokens | — |
| `JWT_ACCESS_EXPIRES_IN` | Duración del access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token | `7d` |

### CORS

| Variable | Descripción | Default |
|---|---|---|
| `CORS_ORIGIN` | Orígenes permitidos separados por coma | `http://localhost:5173` |

### Correo electrónico

| Variable | Descripción | Default |
|---|---|---|
| `SMTP_HOST` | Servidor SMTP | — |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | — |
| `SMTP_PASS` | Contraseña SMTP | — |
| `SMTP_FROM` | Dirección remitente | `noreply@baseforge.local` |

### API Keys externas (opcional)

| Variable | Descripción |
|---|---|
| `SENTRY_DSN` | DSN de Sentry para monitoreo de errores |
| `OTLP_ENDPOINT` | Endpoint de OpenTelemetry |

---

## Generación de secretos

```bash
# Generar JWT_ACCESS_SECRET
openssl rand -hex 32

# Generar JWT_REFRESH_SECRET
openssl rand -hex 32
```

---

## Buenas prácticas

1. **Nunca** comitear `.env` ni archivos con secretos reales
2. **Rotar** secretos periódicamente en producción
3. **Usar** diferentes secretos en cada ambiente
4. **Documentar** cada nueva variable en `.env.example`
5. **Validar** variables requeridas al arrancar la aplicación
