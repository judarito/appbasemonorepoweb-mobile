import { SettingsRepository } from "./settings.repository";
import { SETTINGS_CATALOG, getSettingDefinition } from "./settings.config";
import { encrypt, decrypt } from "../../common/crypto";
import { ValidationError, NotFoundError } from "../../common/errors";

export class SettingsService {
  private repository = new SettingsRepository();
  private cache = new Map<string, { data: any; expiresAt: number }>();
  private CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache

  private getCacheKey(tenantId: string, isPublicOnly: boolean): string {
    return `${tenantId}:${isPublicOnly}`;
  }

  private getCached(tenantId: string, isPublicOnly: boolean) {
    const entry = this.cache.get(this.getCacheKey(tenantId, isPublicOnly));
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    return null;
  }

  private setCached(tenantId: string, isPublicOnly: boolean, data: any) {
    this.cache.set(this.getCacheKey(tenantId, isPublicOnly), {
      data,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  public clearCache(tenantId: string) {
    this.cache.delete(this.getCacheKey(tenantId, true));
    this.cache.delete(this.getCacheKey(tenantId, false));
  }

  async getSettingsForTenant(tenantId: string, isPublicOnly: boolean = false) {
    // 1. Revisar caché
    const cached = this.getCached(tenantId, isPublicOnly);
    if (cached) {
      return cached;
    }

    // 2. Traer configuraciones guardadas de BD
    const dbSettings = await this.repository.findSettingsByTenant(tenantId);
    const dbSettingsMap = new Map(dbSettings.map((s) => [s.key, s]));

    // 3. Cruzar con el catálogo y armar resultado final
    const result: any[] = [];

    for (const def of SETTINGS_CATALOG) {
      if (isPublicOnly && !def.isPublic) {
        continue;
      }

      const dbSetting = dbSettingsMap.get(def.key);
      let value = def.defaultValue;
      let isConfigured = false;

      if (dbSetting) {
        isConfigured = true;
        value = dbSetting.value;

        // Descifrar si está marcado como cifrado y NO es secreto
        if (dbSetting.isEncrypted && def.valueType !== "SECRET_REFERENCE") {
          value = decrypt(String(value));
        }
      }

      // Enmascarar secretos para no exponerlos al cliente
      if (def.valueType === "SECRET_REFERENCE") {
        if (dbSetting && dbSetting.value !== null) {
          value = "********";
        } else {
          value = null;
        }
      }

      result.push({
        key: def.key,
        groupName: def.groupName,
        valueType: def.valueType,
        isPublic: def.isPublic,
        value,
        description: def.description,
        isConfigured,
      });
    }

    // 4. Guardar en caché y retornar
    this.setCached(tenantId, isPublicOnly, result);
    return result;
  }

  async getInternalValue(tenantId: string, key: string): Promise<any> {
    const def = getSettingDefinition(key);
    if (!def) {
      throw new NotFoundError(`La clave de configuración '${key}' no existe en el catálogo.`);
    }

    const dbSetting = await this.repository.findByKey(tenantId, key);
    if (!dbSetting) {
      return def.defaultValue;
    }

    let value = dbSetting.value;
    if (dbSetting.isEncrypted) {
      value = decrypt(String(value));
    }

    // Castear tipos correspondientes
    if (def.valueType === "NUMBER") {
      return Number(value);
    }
    if (def.valueType === "BOOLEAN") {
      return value === "true" || value === true;
    }
    if (def.valueType === "JSON") {
      return typeof value === "string" ? JSON.parse(value) : value;
    }

    return value;
  }

  async updateSettings(
    tenantId: string,
    settingsToUpdate: { key: string; value: any }[],
    actorUserId: string
  ) {
    if (!settingsToUpdate || !Array.isArray(settingsToUpdate)) {
      throw new ValidationError("La lista de configuraciones a actualizar es inválida.");
    }

    const beforeData: Record<string, any> = {};
    const afterData: Record<string, any> = {};

    // Obtener estado anterior para auditoría
    const currentDbSettings = await this.repository.findSettingsByTenant(tenantId);
    currentDbSettings.forEach((s) => {
      beforeData[s.key] = s.value;
    });

    for (const update of settingsToUpdate) {
      const def = getSettingDefinition(update.key);
      if (!def) {
        throw new ValidationError(`La clave de configuración '${update.key}' no existe en el catálogo.`);
      }

      let value = update.value;

      // Ignorar secretos que no han cambiado
      if (def.valueType === "SECRET_REFERENCE" && value === "********") {
        continue;
      }

      // Validar tipo de datos
      if (value !== null && value !== undefined) {
        if (def.valueType === "BOOLEAN" && typeof value !== "boolean") {
          throw new ValidationError(`El valor para '${update.key}' debe ser booleano.`);
        }
        if (def.valueType === "NUMBER" && typeof value !== "number") {
          throw new ValidationError(`El valor para '${update.key}' debe ser numérico.`);
        }
        if (def.valueType === "STRING" && typeof value !== "string") {
          throw new ValidationError(`El valor para '${update.key}' debe ser una cadena.`);
        }
        if (def.valueType === "JSON" && typeof value !== "object") {
          throw new ValidationError(`El valor para '${update.key}' debe ser un JSON válido.`);
        }
      }

      let isEncrypted = false;
      if (value !== null && value !== undefined) {
        // Cifrar secretos o campos que lo requieran
        if (def.valueType === "SECRET_REFERENCE") {
          value = encrypt(String(value));
          isEncrypted = true;
        }
      }

      // Guardar en base de datos
      await this.repository.upsertSetting({
        tenantId,
        key: def.key,
        groupName: def.groupName,
        value,
        valueType: def.valueType,
        isPublic: def.isPublic,
        isEncrypted,
        description: def.description,
        updatedBy: actorUserId,
      });

      afterData[def.key] = def.valueType === "SECRET_REFERENCE" ? "********" : value;
    }

    // Limpiar caché
    this.clearCache(tenantId);

    // Escribir en la bitácora de auditoría
    await this.repository.logAudit({
      tenantId,
      actorUserId,
      action: "TENANT_SETTINGS_UPDATE",
      entityType: "TENANT_SETTINGS",
      entityId: tenantId,
      result: "SUCCESS",
      beforeData,
      afterData,
    });

    return { success: true };
  }
}
