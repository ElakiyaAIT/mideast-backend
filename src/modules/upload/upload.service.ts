import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import type { IStorageProvider } from './storage/storage-provider.interface';
import { STORAGE_PROVIDER_TOKEN } from './storage/storage-provider.token';

export interface UploadedFile {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(@Inject(STORAGE_PROVIDER_TOKEN) private readonly storageProvider: IStorageProvider) {
    this.verifyStorageAvailability();
  }

  private verifyStorageAvailability(): void {
    if (!this.storageProvider.isAvailable()) {
      this.logger.error('Storage provider is not available');
      throw new Error('File upload service is not available');
    }
    this.logger.log('Storage provider is ready');
  }

  /**
   * Upload multiple files to storage
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'equipment',
  ): Promise<UploadedFile[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) => this.uploadSingleFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Upload a single file to storage
   */
  async uploadSingleFile(file: Express.Multer.File, folder: string): Promise<UploadedFile> {
    try {
      // Validate file
      this.validateFile(file);

      // Use storage provider to upload file
      const uploadedFile = await this.storageProvider.uploadFile(file, folder);

      return uploadedFile;
    } catch (error) {
      this.logger.error('File upload failed', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      // videos
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo', // avi

      // documents
      'application/pdf',
      'application/msword', // doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/vnd.ms-excel', // xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    ];
    const videoLimit = 100 * 1024 * 1024; // 100MB
    const documentLimit = 20 * 1024 * 1024; // 20MB

    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds 10MB limit`);
    }
    if (file.mimetype.startsWith('video/') && file.size > videoLimit) {
      throw new BadRequestException('Video exceeds 100MB');
    }
    if (file.mimetype.startsWith('application/') && file.size > documentLimit) {
      throw new BadRequestException('Document exceeds 20MB');
    }
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      await this.storageProvider.deleteFile(fileUrl);
      this.logger.log(`File deleted: ${fileUrl}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${fileUrl}`, error);
      // Don't throw error, just log it
    }
  }

  /**
   * Delete multiple files from storage
   */
  async deleteFiles(fileUrls: string[]): Promise<void> {
    if (!fileUrls || fileUrls.length === 0) {
      return;
    }

    await this.storageProvider.deleteFiles(fileUrls);
  }
}
