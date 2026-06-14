import { StorageProvider } from "./storage.interface";
import { LocalStorageProvider } from "./local.provider";
import { S3StorageProvider } from "./s3.provider";
import { AzureStorageProvider } from "./azure.provider";

export class StorageFactory {
  /**
   * Retorna la instancia del StorageProvider activo basado en la configuración.
   */
  static getProvider(): StorageProvider {
    const provider = (process.env.STORAGE_PROVIDER || "LOCAL").toUpperCase();

    switch (provider) {
      case "S3":
      case "R2":
        return new S3StorageProvider();
      case "AZURE":
        return new AzureStorageProvider();
      case "LOCAL":
      default:
        return new LocalStorageProvider();
    }
  }
}
