# Procedimiento Operativo de Incidentes — BaseForge SaaS

Este documento establece el protocolo estándar de observabilidad, análisis y respuesta ante incidentes operativos o caídas del servicio en la plataforma BaseForge SaaS.

---

## 1. Identificación y Trazabilidad de Errores

### Correlación mediante `traceId`
Toda petición que entra al ecosistema de BaseForge recibe o propaga un identificador único de trazabilidad (`traceId`) a través de la cabecera HTTP `x-trace-id` (o `x-request-id`).

1. **En la API (Backend):** 
   - El `traceId` se registra de forma estructurada en Pino en cada petición y respuesta.
   - Cualquier error capturado por `errorHandler` inyecta automáticamente el `traceId` en el payload de respuesta JSON.
2. **En la aplicación Web y Móvil:**
   - Si un usuario reporta un error en la interfaz o una petición falla, el frontend muestra y registra el `traceId` correspondiente.
   - Use este `traceId` para filtrar logs en su concentrador (Elasticsearch, Loki, Grafana, CloudWatch, etc.).

Ejemplo de búsqueda en logs:
```json
{ "traceId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" }
```

---

## 2. Monitoreo de Salud y Recursos

La plataforma expone dos endpoints de monitoreo de infraestructura automatizado (Kubernetes, AWS Target Groups, etc.):

### A. Health Check básico (`/health`)
- **Frecuencia recomendada:** Cada 5-10 segundos.
- **Objetivo:** Determinar la vitalidad del proceso de aplicación (Liveness Probe).
- **Métricas expuestas:** Uso de CPU, memoria heap usada/total, RSS, uptime.
- **Acción ante fallo (5xx o Sin Respuesta):** Reiniciar automáticamente el contenedor o servicio.

### B. Readiness Check completo (`/ready`)
- **Frecuencia recomendada:** Cada 15-30 segundos.
- **Objetivo:** Verificar que la aplicación está lista para recibir tráfico (Readiness Probe).
- **Prueba realizada:** Consulta de prueba a la base de datos (`SELECT 1`). Expone la métrica `databaseLatencyMs`.
- **Acción ante fallo (503 Service Unavailable):** Retirar la instancia del balanceador de carga para evitar servir errores a los usuarios, manteniendo la instancia viva para diagnóstico.

---

## 3. Diagnóstico de Degradación del Sistema

### Umbrales de Alertas Recomendadas

| Métrica | Umbral de Alerta | Acción Correctiva |
| :--- | :--- | :--- |
| **Database Latency** | `> 100ms` (Promedio) | Analizar conexiones activas, habilitar Logs de Consultas Lentas (Slow Queries), considerar escalado horizontal de la base de datos. |
| **Uso de Memoria Heap** | `> 85%` de la memoria asignada | Identificar posibles memory leaks utilizando perfiles de memoria de Node/Bun. Programar reinicio controlado (Graceful Shutdown). |
| **Tasa de Errores API** | `> 5%` del tráfico total en 5 min | Verificar el dashboard de Sentry. Filtrar logs buscando códigos de estado `500` y correlacionar por la ruta o tenant afectado. |

---

## 4. Respuestas y Mitigación Rápida

### Caída Total de la Base de Datos (`/ready` en estado `DOWN`)
1. **Comprobar conectividad de red:** Asegurar que el host de base de datos es accesible desde el contenedor de la API.
2. **Revisar pool de conexiones:** Comprobar si se ha alcanzado la cantidad máxima de conexiones simultáneas en PostgreSQL (`max_connections`).
3. **Reiniciar el servicio de API:** Forzar un despliegue de tipo rolling para liberar pools bloqueados.

### Fugas de Memoria (Memory Leaks)
1. Si `/health` muestra un incremento constante de `heapUsedBytes` que no disminuye con el Garbage Collector, el proceso terminará con un error `Out of Memory`.
2. **Mitigación temporal:** Configurar el tamaño máximo de la memoria de Bun/Node (`--max-old-space-size`) y desplegar réplicas adicionales para distribuir la carga.
3. **Solución:** Analizar la retención de variables globales, escuchadores de eventos sin remover, o fugas en el almacenamiento de caché local.

---

## 5. Integración de Telemetría Externa

Para activar la telemetría en producción, configure las siguientes variables de entorno:

- **Sentry (Gestión de Errores):**
  ```bash
  SENTRY_DSN="https://publicKey@oXXXXXX.ingest.sentry.io/productKey"
  ```
- **OpenTelemetry (Métricas y Trazas):**
  ```bash
  OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
  ```
