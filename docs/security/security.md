# Seguridad — BaseForge SaaS

> **BF-3107** — Versión 1.0 — 2026-06-14

---

## Principios

1. **La API es la única autoridad** en autorización y validación
2. **Defensa en profundidad**: múltiples capas de seguridad
3. **Mínimo privilegio**: cada acción requiere el permiso específico
4. **Validación en servidor**: nunca confiar en datos del cliente

---

## Headers de seguridad

La API incluye los siguientes headers en todas las respuestas:

| Header | Valor | Propósito |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevenir MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevenir clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Protección XSS en navegadores antiguos |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forzar HTTPS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control de referrer |

---

## Rate limiting

Protegido contra abusos:

| Endpoint | Límite | Ventana |
|---|---|---|
| `/api/v1/auth/login` | 5 intentos | 15 minutos |
| `/api/v1/auth/forgot-password` | 3 solicitudes | 1 hora |
| `/api/v1/auth/register` | 3 registros | 1 hora |
| API general | 100 requests | 1 minuto |

---

## Protección de contraseñas

- Hash: `Bun.password.hash()` con bcrypt (cost factor 10+)
- Mínimo 8 caracteres
- Máximo 128 caracteres
- Bloqueo tras 5 intentos fallidos (15 min)
- Las contraseñas nunca se registran en logs

---

## JWT

| Tipo | Duración | Almacenamiento |
|---|---|---|
| Access Token | 15 minutos | Memoria (Zustand) |
| Refresh Token | 7 días | HTTP-only cookie / Secure Store (mobile) |

- Los refresh tokens se almacenan hasheados en BD
- Rotación de refresh tokens (cada uso genera uno nuevo)
- Detección de robo: si un refresh token ya usado se reutiliza, se invalidan todos los de la familia

---

## Validación de permisos

Ver [Roles y permisos](./roles-permissions.md).

---

## Protección contra ataques comunes

| Ataque | Protección |
|---|---|
| SQL Injection | Drizzle ORM (parametrización automática) |
| XSS | React (escape automático), Content-Security-Policy |
| CSRF | SameSite cookies, tokens CSRF en mutaciones |
| Brute Force | Rate limiting + bloqueo de cuenta |
| Token Theft | Refresh token rotativo, token version |
| Tenant Escalation | Validación de membresía en cada request |
| File Upload | Validación MIME, límite de tamaño, escaneo |

---

## CORS

Configurado por ambiente:

| Ambiente | Origen permitido |
|---|---|
| Local | `http://localhost:5173` |
| Development | `https://dev.baseforge.app` |
| Staging | `https://staging.baseforge.app` |
| Production | `https://app.baseforge.app` |

---

## Dependencias

- Escaneo automático de vulnerabilidades en CI
- `bun audit` periódico
- Dependencias actualizadas mensualmente
- Dependencias dev separadas de production
