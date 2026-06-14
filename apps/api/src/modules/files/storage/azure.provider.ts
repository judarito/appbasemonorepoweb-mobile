import { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from "@azure/storage-blob";
import { StorageProvider } from "./storage.interface";

export class AzureStorageProvider implements StorageProvider {
  private client: BlobServiceClient;
  private credential?: StorageSharedKeyCredential;

  constructor() {
    const connectionString = process.env.STORAGE_AZURE_CONNECTION_STRING || "";
    const accountName = process.env.STORAGE_AZURE_ACCOUNT_NAME || "";
    const accountKey = process.env.STORAGE_AZURE_ACCOUNT_KEY || "";

    if (connectionString) {
      this.client = BlobServiceClient.fromConnectionString(connectionString);
      try {
        const matches = connectionString.match(/AccountName=([^;]+);AccountKey=([^;]+)/);
        if (matches) {
          this.credential = new StorageSharedKeyCredential(matches[1], matches[2]);
        }
      } catch (err) {
        console.warn("No se pudo extraer credenciales de la cadena de conexión Azure para firmas SAS:", err);
      }
    } else {
      this.credential = new StorageSharedKeyCredential(accountName, accountKey);
      this.client = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        this.credential
      );
    }
  }

  async uploadFile(bucket: string, key: string, fileBuffer: Buffer, mimeType: string): Promise<void> {
    const containerClient = this.client.getContainerClient(bucket);
    await containerClient.createIfNotExists();
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });
  }

  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    const containerClient = this.client.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    const downloadResponse = await blockBlobClient.download(0);
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error(`El archivo ${key} no tiene contenido descargable en Azure.`);
    }

    const chunks: any[] = [];
    for await (const chunk of downloadResponse.readableStreamBody as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    const containerClient = this.client.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    await blockBlobClient.deleteIfExists();
  }

  async getSignedUploadUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string> {
    if (!this.credential) {
      throw new Error("Las credenciales de Azure no están configuradas para firmar URLs de subida.");
    }
    const containerClient = this.client.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    const sasToken = generateBlobSASQueryParameters({
      containerName: bucket,
      blobName: key,
      permissions: BlobSASPermissions.parse("w"),
      expiresOn: new Date(Date.now() + expiresInSeconds * 1000),
    }, this.credential).toString();

    return `${blockBlobClient.url}?${sasToken}`;
  }

  async getSignedDownloadUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string> {
    if (!this.credential) {
      throw new Error("Las credenciales de Azure no están configuradas para firmar URLs de descarga.");
    }
    const containerClient = this.client.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    const sasToken = generateBlobSASQueryParameters({
      containerName: bucket,
      blobName: key,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn: new Date(Date.now() + expiresInSeconds * 1000),
    }, this.credential).toString();

    return `${blockBlobClient.url}?${sasToken}`;
  }
}
