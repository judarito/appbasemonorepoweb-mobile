import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageProvider } from "./storage.interface";

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;

  constructor() {
    const region = process.env.STORAGE_S3_REGION || "us-east-1";
    const endpoint = process.env.STORAGE_S3_ENDPOINT; // Útil para Cloudflare R2
    const accessKeyId = process.env.STORAGE_S3_ACCESS_KEY_ID || "";
    const secretAccessKey = process.env.STORAGE_S3_SECRET_ACCESS_KEY || "";

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: endpoint ? true : undefined,
    });
  }

  async uploadFile(bucket: string, key: string, fileBuffer: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      })
    );
  }

  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new Error(`El archivo ${key} está vacío o no contiene datos.`);
    }

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  }

  async getSignedUploadUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async getSignedDownloadUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
