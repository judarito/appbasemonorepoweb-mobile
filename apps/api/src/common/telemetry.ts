import { logger } from "../middlewares/logger";

export interface TelemetryConfig {
  sentryDsn?: string;
  environment?: string;
  otelExporterEndpoint?: string;
}

class TelemetryService {
  private active = false;

  initialize(config: TelemetryConfig = {}) {
    const sentryDsn = config.sentryDsn || process.env.SENTRY_DSN;
    const environment = config.environment || process.env.NODE_ENV || "development";
    const otelEndpoint = config.otelExporterEndpoint || process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    if (sentryDsn) {
      logger.info({ msg: "Initializing Sentry integration...", environment });
      // Aquí se inicializaría el SDK real de Sentry:
      // Sentry.init({ dsn: sentryDsn, environment });
      this.active = true;
    }

    if (otelEndpoint) {
      logger.info({ msg: "Initializing OpenTelemetry integration...", endpoint: otelEndpoint });
      // Aquí se inicializaría el SDK de OpenTelemetry Node:
      // const sdk = new NodeSDK({ ... });
      // sdk.start();
      this.active = true;
    }

    if (!this.active) {
      logger.info({ msg: "Telemetry services initialized in local mock mode (Sentry/OTel disabled)" });
    }
  }

  captureException(error: Error, context?: Record<string, any>) {
    logger.error({
      err: error,
      context,
      msg: `[Telemetry Exception] Captured exception: ${error.message}`
    });
    // Si Sentry estuviera activo:
    // Sentry.captureException(error, { extra: context });
  }

  startSpan(name: string) {
    // Retorna una función para cerrar el span
    logger.debug({ msg: `[Telemetry Span Started] ${name}` });
    return () => {
      logger.debug({ msg: `[Telemetry Span Ended] ${name}` });
    };
  }
}

export const telemetry = new TelemetryService();
