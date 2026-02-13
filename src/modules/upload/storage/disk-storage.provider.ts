import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import type { IStorageProvider, DiskStorageConfig } from './storage-provider.interface';
import { UploadedFile } from '../upload.service';

@Injectable()
export class DiskStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(DiskStorageProvider.name);
  private isInitialized = false;

  constructor(private readonly config: DiskStorageConfig) {}

  async initialize(): Promise<void> {
    try {
      // Ensure upload directory exists
      await this.ensureDirectoryExists(this.config.uploadPath);
      this.isInitialized = true;
      this.logger.log(`Disk storage initialized successfully at: ${this.config.uploadPath}`);
    } catch (error) {
      this.logger.error('Failed to initialize disk storage', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<UploadedFile> {
    try {
      // Generate unique filename
      const ext = file.originalname.split('.').pop();
      const filename = `${randomUUID()}.${ext}`;
      const relativePath = join(folder, filename);
      const fullPath = join(this.config.uploadPath, relativePath);

      // Ensure folder exists
      await this.ensureDirectoryExists(dirname(fullPath));

      // Write file to disk
      await fs.writeFile(fullPath, file.buffer);

      // Generate public URL
      const url = `${this.config.baseUrl}/${relativePath.replace(/\\/g, '/')}`;

      this.logger.log(`File uploaded successfully: ${relativePath}`);

      return {
        url,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to disk', error);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract relative path from URL
      const relativePath = this.extractPathFromUrl(fileUrl);
      if (!relativePath) {
        this.logger.warn(`Cannot extract path from URL: ${fileUrl}`);
        return;
      }

      const fullPath = join(this.config.uploadPath, relativePath);

      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch {
        this.logger.warn(`File does not exist: ${fullPath}`);
        return;
      }

      // Delete file
      await fs.unlink(fullPath);
      this.logger.log(`File deleted successfully: ${relativePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${fileUrl}`, error);
      // Don't throw error, just log it
    }
  }

  async deleteFiles(fileUrls: string[]): Promise<void> {
    if (!fileUrls || fileUrls.length === 0) {
      return;
    }

    const deletePromises = fileUrls.map((url) => this.deleteFile(url));
    await Promise.allSettled(deletePromises);
  }

  /**
   * Ensure directory exists, create if not
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      this.logger.log(`Created directory: ${dirPath}`);
    }
  }

  /**
   * Extract relative path from URL
   * Example: http://localhost:3000/uploads/equipment/abc.jpg -> equipment/abc.jpg
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      const baseUrl = this.config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
      if (!url.startsWith(baseUrl)) {
        this.logger.warn(`URL does not match base URL: ${url}`);
        return null;
      }

      const relativePath = url.substring(baseUrl.length + 1); // +1 for the slash
      return relativePath;
    } catch (error) {
      this.logger.error(`Failed to extract path from URL: ${url}`, error);
      return null;
    }
  }
}
