# Guía de Actualización desde Plantilla — BaseForge SaaS

> **BF-3214 / BF-3305** — Versión 2.0 — 2026-06-14

---

## Modelo híbrido: plantilla + paquetes

BaseForge usa un modelo híbrido para facilitar actualizaciones:

| Componente | Estrategia | Actualización |
|---|---|---|
| `packages/*` | Paquetes npm versionados | `bun update @baseforge/shared` |
| `apps/*`, `database/*`, `infra/*` | Plantilla Git | `git merge upstream/develop` |

Ver [Plantilla vs Paquetes](../architecture/template-vs-packages.md) para más detalle.

---

## Escenario

Tienes un fork de BaseForge (ej: `ofirone`) y quieres recibir actualizaciones
del repositorio original de BaseForge sin perder tus cambios.

---

## Estrategia recomendada

### 1. Actualizar paquetes primero

```bash
# Actualizar paquetes versionados a la última versión
bun update @baseforge/shared
bun update @baseforge/validation
bun update @baseforge/api-client
```

Verificar que no haya breaking changes (revisar CHANGELOG.md de cada paquete).

### 2. Actualizar plantilla

Usar `git merge` desde el repositorio original como remote adicional:

```bash
# 1. Agregar BaseForge como remote (solo la primera vez)
git remote add upstream https://github.com/tu-org/baseforge.git

# 2. Traer cambios
git fetch upstream --tags

# 3. Hacer merge de un tag específico (recomendado) o de develop
git checkout develop
git merge upstream/v1.1.0

# 4. Resolver conflictos
# Los conflictos típicos serán en:
#   - package.json (dependencias)
#   - apps/web/src/ (componentes)
#   - apps/api/src/ (módulos)

# 5. Probar que todo funcione
bun run build
bun run test
bun run db:migrate  # si hay migraciones nuevas
```

---

## Política de breaking changes (BF-3306)

| Tipo de cambio | Versión | Ejemplo |
|---|---|---|
| Breaking change en paquete | Major (`1.0.0` → `2.0.0`) | Cambio en firma de función |
| Nueva funcionalidad compatible | Minor (`1.0.0` → `1.1.0`) | Nuevo endpoint |
| Bug fix compatible | Patch (`1.0.0` → `1.0.1`) | Corrección de error |

Para la plantilla:
- Los breaking changes se documentan en el changelog global
- Se recomienda usar tags (`v1.0.0`, `v1.1.0`) para versiones estables
- Los forks deben hacer merge contra tags, no contra `develop` a menos que quieran el último código

### Cómo identificar un breaking change

Un cambio es **breaking** si:
- Requiere modificar código del fork para seguir funcionando
- Cambia la firma de una función/endpoint público
- Elimina un endpoint o campo de respuesta
- Requiere una migración de base de datos no retrocompatible
- Cambia el comportamiento esperado de una funcionalidad

---

## Archivos que suelen tener conflictos

| Archivo | Riesgo | Estrategia |
|---|---|---|
| `package.json` | Alto | Preferir versión del fork, agregar dependencias nuevas manualmente |
| `bun.lock` | Alto | Regenerar con `bun install` |
| `docker-compose.yml` | Bajo | Generalmente compatible |
| `apps/api/src/main.ts` | Medio | Revisar nuevos middlewares/módulos |
| `apps/web/src/App.tsx` | Medio | Revisar nuevas rutas |
| `database/migrations/` | Bajo | Archivos nuevos no afectan existentes |
| `.env.example` | Bajo | Agregar nuevas variables |

---

## Mantener el fork actualizado

```bash
# Cada cierto tiempo (semanal/mensual):
# 1. Actualizar paquetes
bun update @baseforge/shared @baseforge/api-client @baseforge/validation

# 2. Traer cambios de plantilla
git fetch upstream --tags
git checkout develop
git merge upstream/v1.1.0  # o el tag más reciente

# 3. Resolver conflictos

# 4. Probar
bun run build
bun run test
bun run db:migrate
git push origin develop
```

---

## Automatización (BF-3308)

```bash
# Usar el script de actualización automática
bun run scripts/update-from-template.ts
```

Este script automatiza el proceso:
1. Verifica que el remote `upstream` esté configurado
2. Busca el último tag disponible
3. Pregunta confirmación antes de proceder
4. Ejecuta `git fetch && git merge`
5. Ejecuta `bun install && bun run build && bun run test`

---

## Buenas prácticas

1. **No modificar archivos core** (`packages/*`, `database/migrations/001_*`, middlewares)
2. **Mantener separados** los módulos del dominio del negocio
3. **Documentar** cada desviación de la plantilla original
4. **Probar** después de cada merge
5. **Usar tags** para versiones estables de la plantilla
6. **Actualizar paquetes primero**, luego la plantilla
7. **Revisar CHANGELOG.md** antes de actualizar para identificar breaking changes
