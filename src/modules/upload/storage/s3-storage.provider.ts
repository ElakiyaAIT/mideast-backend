import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import type { IStorageProvider, S3StorageConfig } from './storage-provider.interface';
import { UploadedFile } from '../upload.service';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private s3Client: S3Client | null = null;
  private isInitialized = false;

  constructor(private readonly config: S3StorageConfig) {}

  async initialize(): Promise<void> {
    try {
      this.s3Client = new S3Client({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
        endpoint: this.config.endpoint,
        forcePathStyle: this.config.forcePathStyle ?? false,
      });

      this.isInitialized = true;
      this.logger.log(
        `S3 storage initialized successfully for bucket: ${this.config.bucket}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize S3 storage', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized && this.s3Client !== null;
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<UploadedFile> {
    if (!this.s3Client) {
      throw new Error('S3 client is not initialized');
    }

    try {
      // Generate unique filename
      const ext = file.originalname.split('.').pop();
      const filename = `${randomUUID()}.${ext}`;
      const key = `${folder}/${filename}`;

      const input: PutObjectCommandInput = {
        Bucket: this.config.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      };

      // Upload file to S3
      const command = new PutObjectCommand(input);
      await this.s3Client.send(command);

      // Generate public URL
      const url = this.generatePublicUrl(key);

      this.logger.log(`File uploaded successfully to S3: ${key}`);

      return {
        url,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to S3', error);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.s3Client) {
      this.logger.warn('S3 client not initialized, cannot delete file');
      return;
    }

    try {
      // Extract key from URL
      const key = this.extractKeyFromUrl(fileUrl);
      if (!key) {
        this.logger.warn(`Cannot extract key from URL: ${fileUrl}`);
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${fileUrl}`, error);
      // Don't throw error, just log it
    }
  }

  async deleteFiles(fileUrls: string[]): Promise<void> {
    if (!this.s3Client || !fileUrls || fileUrls.length === 0) {
      return;
    }

    try {
      // Extract keys from URLs
      const keys = fileUrls
        .map((url) => this.extractKeyFromUrl(url))
        .filter((key): key is string => key !== null);

      if (keys.length === 0) {
        return;
      }

      // Delete multiple objects at once (more efficient)
      const command = new DeleteObjectsCommand({
        Bucket: this.config.bucket,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
        },
      });

      await this.s3Client.send(command);
      this.logger.log(`Deleted ${keys.length} files from S3`);
    } catch (error) {
      this.logger.error('Failed to delete multiple files from S3', error);
      // Fallback to individual deletion
      const deletePromises = fileUrls.map((url) => this.deleteFile(url));
      await Promise.allSettled(deletePromises);
    }
  }

  /**
   * Generate public URL for S3 object
   */
  private generatePublicUrl(key: string): string {
    if (this.config.endpoint) {
      // Custom endpoint (e.g., MinIO, DigitalOcean Spaces)
      return `${this.config.endpoint}/${this.config.bucket}/${key}`;
    } else {
      // Standard AWS S3 URL
      return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    }
  }

  /**
   * Extract S3 key from URL
   * Example: https://bucket.s3.region.amazonaws.com/folder/file.jpg -> folder/file.jpg
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Remove leading slash
      let key = pathname.startsWith('/') ? pathname.substring(1) : pathname;

      // If using custom endpoint with bucket in path
      if (this.config.endpoint && key.startsWith(`${this.config.bucket}/`)) {
        key = key.substring(this.config.bucket.length + 1);
      }

      return key;
    } catch (error) {
      this.logger.error(`Failed to extract key from URL: ${url}`, error);
      return null;
    }
  }
}
