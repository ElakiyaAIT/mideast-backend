import { UploadedFile } from '../upload.service';

/**
 * Injection token for IStorageProvider
 * Export for convenience - actual definition is in storage-provider.token.ts
 */
export { STORAGE_PROVIDER_TOKEN } from './storage-provider.token';

/**
 * Storage provider interface
 * All storage implementations must implement this interface
 */
export interface IStorageProvider {
  /**
   * Upload a single file to storage
   * @param file - The file to upload
   * @param folder - The folder path where the file should be stored
   * @returns Uploaded file metadata including URL
   */
  uploadFile(file: Express.Multer.File, folder: string): Promise<UploadedFile>;

  /**
   * Delete a file from storage
   * @param fileUrl - The URL or path of the file to delete
   */
  deleteFile(fileUrl: string): Promise<void>;

  /**
   * Delete multiple files from storage
   * @param fileUrls - Array of URLs or paths of files to delete
   */
  deleteFiles(fileUrls: string[]): Promise<void>;

  /**
   * Initialize the storage provider
   * Called when the provider is first created
   */
  initialize(): Promise<void>;

  /**
   * Check if the storage provider is properly configured and ready
   */
  isAvailable(): boolean;
}

/**
 * Storage provider types
 */
export enum StorageProviderType {
  DISK = 'disk',
  S3 = 's3',
  FIREBASE = 'firebase',
}

/**
 * Storage configuration for disk storage
 */
export interface DiskStorageConfig {
  uploadPath: string; // Base path for file uploads (e.g., './uploads')
  baseUrl: string; // Base URL for accessing files (e.g., 'http://localhost:3000/uploads')
}

/**
 * Storage configuration for AWS S3
 */
export interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // Optional custom endpoint (for S3-compatible services)
  forcePathStyle?: boolean; // For S3-compatible services
  validateOnStartup?: boolean;
}

/**
 * Main storage configuration
 */
export interface StorageConfig {
  provider: StorageProviderType;
  disk?: DiskStorageConfig;
  s3?: S3StorageConfig;
}
