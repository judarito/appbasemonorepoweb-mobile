import { StorageProvider } from "./storage.interface";
import fs from "fs/promises";
import path from "path";

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = process.env.STORAGE_LOCAL_PATH || path.resolve(process.cwd(), "uploads");
  }

  private getFilePath(bucket: string, key: string): string {
    // Sanitizar bucket y key para evitar directory traversal
    const safeBucket = path.normalize(bucket).replace(/^(\.\.(\/|\\|$))+/, "");
    const safeKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
    return path.join(this.baseDir, safeBucket, safeKey);
  }

  async uploadFile(bucket: string, key: string, fileBuffer: Buffer, mimeType: string): Promise<void> {
    const filePath = this.getFilePath(bucket, key);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, fileBuffer);
  }

  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    const filePath = this.getFilePath(bucket, key);
    return await fs.readFile(filePath);
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    const filePath = this.getFilePath(bucket, key);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  }

  async getSignedUploadUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string> {
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/v1/files/local-upload?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`;
  }

  async getSignedDownloadUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string> {
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/v1/files/local-download?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`;
  }
}
