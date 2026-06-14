import { db } from "../database/db";
import { auditLogs } from "../database/schema";

// Claves cuyo valor debe ser enmascarado en beforeData/afterData
const SENSITIVE_KEYS = [
  "password",
  "passwordHash",
  "password_hash",
  "token",
  "refresh_token",
  "refreshToken",
  "secret",
  "apiKey",
  "api_key",
  "private_key",
  "privateKey",
  "hash",
  "smtp_password",
  "webhook_secret",
];

function maskSensitiveFields(data: any): any {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(maskSensitiveFields);
  }

  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some((sk) =>
      key.toLowerCase().includes(sk.toLowerCase())
    );
    if (isSensitive) {
      masked[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveFields(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export interface AuditLogData {
  tenantId?: string | null;
  actorUserId?: string | null;
  sessionId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  result: "SUCCESS" | "FAILURE" | "DENIED";
  beforeData?: any;
  afterData?: any;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  traceId?: string | null;
}

class AuditService {
  /**
   * Registra una entrada de auditoría de forma asíncrona (fire-and-forget).
   * No bloquea el flujo del request principal.
   */
  log(data: AuditLogData): void {
    // Fire-and-forget: no await intencional
    this._insert(data).catch((err) => {
      // Silencioso: la auditoría nunca debe romper el flujo de negocio
      console.error("[AuditService] Error al registrar entrada de auditoría:", err?.message);
    });
  }

  /**
   * Versión awaitable para cuando se requiere garantía de escritura.
   */
  async logSync(data: AuditLogData): Promise<void> {
    await this._insert(data);
  }

  private async _insert(data: AuditLogData): Promise<void> {
    await db.insert(auditLogs).values({
      tenantId: data.tenantId ?? null,
      actorUserId: data.actorUserId ?? null,
      sessionId: data.sessionId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      result: data.result,
      beforeData: data.beforeData ? maskSensitiveFields(data.beforeData) : null,
      afterData: data.afterData ? maskSensitiveFields(data.afterData) : null,
      metadata: data.metadata ? maskSensitiveFields(data.metadata) : {},
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      traceId: data.traceId ?? null,
    });
  }
}

export const auditService = new AuditService();
