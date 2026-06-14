import { db } from "../../database/db";
import { files } from "../../database/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { StorageFactory } from "./storage/storage.factory";
import crypto from "crypto";
import path from "path";
import { NotFoundError, ValidationError } from "../../common/errors";

export class FilesService {
  private storage = StorageFactory.getProvider();
  private defaultBucket = process.env.STORAGE_S3_BUCKET || "baseforge-uploads";

  // 10 MB
  private MAX_SIZE_BYTES = 10 * 1024 * 1024;

  private ALLOWED_MIME_TYPES = [
    // Imágenes
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Documentos
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    // Comprimidos
    "application/zip",
    "application/x-zip-compressed",
  ];

  async uploadFile(
    tenantId: string,
    userId: string,
    originalName: string,
    mimeType: string,
    fileBuffer: Buffer,
    visibility: "PRIVATE" | "TENANT" | "PUBLIC" = "PRIVATE"
  ) {
    if (fileBuffer.length > this.MAX_SIZE_BYTES) {
      throw new ValidationError(`El archivo supera el límite máximo permitido de 10 MB.`);
    }

    if (!this.ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      throw new ValidationError(`El tipo de archivo '${mimeType}' no está permitido.`);
    }

    const fileId = crypto.randomUUID();
    const ext = path.extname(originalName);
    const objectKey = `${tenantId}/${fileId}${ext}`;
    const providerName = process.env.STORAGE_PROVIDER || "LOCAL";
    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    await this.storage.uploadFile(this.defaultBucket, objectKey, fileBuffer, mimeType);

    const [fileRecord] = await db
      .insert(files)
      .values({
        id: fileId,
        tenantId,
        uploadedBy: userId,
        storageProvider: providerName,
        bucket: this.defaultBucket,
        objectKey,
        originalName,
        mimeType,
        sizeBytes: fileBuffer.length,
        checksumSha256: checksum,
        visibility,
        status: "ACTIVE",
      })
      .returning();

    const url = await this.getFileUrl(fileRecord);

    return {
      ...fileRecord,
      url,
    };
  }

  async getFile(tenantId: string, fileId: string) {
    const fileRecord = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.tenantId, tenantId)))
      .then((res) => res[0]);

    if (!fileRecord || fileRecord.status === "DELETED") {
      throw new NotFoundError("El archivo solicitado no existe o ha sido eliminado.");
    }

    const url = await this.getFileUrl(fileRecord);

    return {
      ...fileRecord,
      url,
    };
  }

  async deleteFile(tenantId: string, userId: string, fileId: string) {
    const fileRecord = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.tenantId, tenantId)))
      .then((res) => res[0]);

    if (!fileRecord || fileRecord.status === "DELETED") {
      throw new NotFoundError("El archivo no existe o ya fue eliminado.");
    }

    await this.storage.deleteFile(fileRecord.bucket || this.defaultBucket, fileRecord.objectKey);

    await db
      .update(files)
      .set({
        status: "DELETED",
        deletedAt: new Date(),
        deletedBy: userId,
      })
      .where(eq(files.id, fileId));
  }

  async listFiles(tenantId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const baseWhere = and(eq(files.tenantId, tenantId), eq(files.status, "ACTIVE"));

    const [totalRes] = await db.select({ count: count() }).from(files).where(baseWhere);
    const totalItems = totalRes?.count || 0;

    const items = await db
      .select()
      .from(files)
      .where(baseWhere)
      .orderBy(desc(files.createdAt))
      .limit(limit)
      .offset(offset);

    const itemsWithUrls = await Promise.all(
      items.map(async (item) => ({
        ...item,
        url: await this.getFileUrl(item),
      }))
    );

    return {
      items: itemsWithUrls,
      totalItems,
      page,
      limit,
    };
  }

  private async getFileUrl(fileRecord: typeof files.$inferSelect): Promise<string> {
    const bucket = fileRecord.bucket || this.defaultBucket;
    
    if (fileRecord.visibility === "PUBLIC") {
      if (fileRecord.storageProvider.toUpperCase() === "LOCAL") {
        const baseUrl = process.env.APP_URL || "http://localhost:3000";
        return `${baseUrl}/api/v1/files/local-download?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(fileRecord.objectKey)}`;
      } else if (fileRecord.storageProvider.toUpperCase() === "AZURE") {
        return `https://${process.env.STORAGE_AZURE_ACCOUNT_NAME || "account"}.blob.core.windows.net/${bucket}/${fileRecord.objectKey}`;
      } else {
        const endpoint = process.env.STORAGE_S3_ENDPOINT;
        if (endpoint) {
          return `${endpoint}/${bucket}/${fileRecord.objectKey}`;
        }
        return `https://${bucket}.s3.amazonaws.com/${fileRecord.objectKey}`;
      }
    }

    return await this.storage.getSignedDownloadUrl(bucket, fileRecord.objectKey, 900);
  }
}
