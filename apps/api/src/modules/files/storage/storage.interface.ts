export interface StorageProvider {
  /**
   * Sube un buffer de archivo al storage
   */
  uploadFile(bucket: string, key: string, fileBuffer: Buffer, mimeType: string): Promise<void>;

  /**
   * Descarga un archivo del storage y retorna su Buffer
   */
  downloadFile(bucket: string, key: string): Promise<Buffer>;

  /**
   * Elimina un archivo del storage
   */
  deleteFile(bucket: string, key: string): Promise<void>;

  /**
   * Genera una URL firmada de subida (PUT o POST presignada)
   */
  getSignedUploadUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string>;

  /**
   * Genera una URL firmada de descarga (GET presignada)
   */
  getSignedDownloadUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string>;
}
