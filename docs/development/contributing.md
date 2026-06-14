# Contribución — BaseForge SaaS

> **BF-3123** — Versión 1.0 — 2026-06-14

---

## Cómo contribuir

### 1. Reportar issues

Usar el template de issue en GitHub:

```
**Descripción**: [clara y concisa]
**Pasos para reproducir**: [1. 2. 3.]
**Comportamiento esperado**: [qué debería pasar]
**Comportamiento actual**: [qué pasa]
**Contexto adicional**: [logs, screenshots, etc.]
```

### 2. Proponer cambios

1. Crear un fork del repositorio
2. Crear rama desde `develop`: `feature/mi-cambio`
3. Seguir convenciones de código
4. Escribir pruebas
5. Asegurar que `bun run lint && bun run typecheck && bun run test` pase
6. Crear Pull Request hacia `develop`
7. Esperar revisión

### 3. Pull Request

**Checklist antes de crear PR:**
- [ ] El código sigue las convenciones del proyecto
- [ ] Se agregaron pruebas cuando corresponde
- [ ] `bun run lint` pasa sin errores
- [ ] `bun run typecheck` pasa sin errores
- [ ] `bun run test` pasa
- [ ] La documentación se actualizó si aplica
- [ ] Se agregó entrada al changelog

---

## Convenciones de código

- ESLint + Prettier para formato automático
- TypeScript estricto
- Functional components en React
- Nombres en inglés para código, español para documentación

---

## Código de conducta

- Ser respetuoso
- Enfocarse en lo técnico
- Aceptar críticas constructivas
- Ayudar a otros contribuyentes
