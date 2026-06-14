import { db } from "../../database/db";
import { tenantSettings, auditLogs } from "../../database/schema";
import { eq, and } from "drizzle-orm";

export class SettingsRepository {
  async findSettingsByTenant(tenantId: string) {
    return await db
      .select()
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, tenantId));
  }

  async findByKey(tenantId: string, key: string) {
    return await db
      .select()
      .from(tenantSettings)
      .where(and(eq(tenantSettings.tenantId, tenantId), eq(tenantSettings.key, key)))
      .limit(1)
      .then((res) => res[0] || null);
  }

  async upsertSetting(data: {
    tenantId: string;
    key: string;
    groupName: string;
    value: any;
    valueType: string;
    isPublic: boolean;
    isEncrypted: boolean;
    description?: string;
    updatedBy: string;
  }) {
    return await db
      .insert(tenantSettings)
      .values({
        tenantId: data.tenantId,
        key: data.key,
        groupName: data.groupName,
        value: data.value,
        valueType: data.valueType,
        isPublic: data.isPublic,
        isEncrypted: data.isEncrypted,
        description: data.description || null,
        updatedBy: data.updatedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [tenantSettings.tenantId, tenantSettings.key],
        set: {
          value: data.value,
          isPublic: data.isPublic,
          isEncrypted: data.isEncrypted,
          updatedBy: data.updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
  }

  async logAudit(data: {
    tenantId: string;
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    result: "SUCCESS" | "FAILURE" | "DENIED";
    beforeData?: any;
    afterData?: any;
    metadata?: any;
  }) {
    await db.insert(auditLogs).values({
      tenantId: data.tenantId,
      actorUserId: data.actorUserId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      result: data.result,
      beforeData: data.beforeData || null,
      afterData: data.afterData || null,
      metadata: data.metadata || {},
    });
  }
}
