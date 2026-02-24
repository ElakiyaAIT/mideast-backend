import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../../common/config/config.service';
import {
  IStorageProvider,
  StorageProviderType,
  DiskStorageConfig,
  S3StorageConfig,
} from './storage-provider.interface';
import { DiskStorageProvider } from './disk-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

@Injectable()
export class StorageProviderFactory {
  private readonly logger = new Logger(StorageProviderFactory.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Create and initialize the appropriate storage provider based on configuration
   */
  async createStorageProvider(): Promise<IStorageProvider> {
    const storageConfig = this.configService.getStorageConfig();
    const providerType = storageConfig.provider as StorageProviderType;

    this.logger.log(`Creating storage provider: ${providerType}`);

    let provider: IStorageProvider;

    switch (providerType) {
      case StorageProviderType.DISK:
        provider = this.createDiskStorageProvider(storageConfig.disk!);
        break;

      case StorageProviderType.S3:
        provider = this.createS3StorageProvider(storageConfig.s3!);
        break;

      default:
        throw new Error(`Unsupported storage provider: ${providerType}`);
    }

    // Initialize the provider
    await provider.initialize();

    // Verify provider is available
    if (!provider.isAvailable()) {
      throw new Error(`Storage provider ${providerType} is not available after initialization`);
    }

    this.logger.log(`Storage provider ${providerType} initialized successfully`);

    return provider;
  }

  /**
   * Create disk storage provider
   */
  private createDiskStorageProvider(config: DiskStorageConfig): DiskStorageProvider {
    if (!config) {
      throw new Error('Disk storage configuration is missing');
    }

    if (!config.uploadPath || !config.baseUrl) {
      throw new Error('Disk storage configuration must include uploadPath and baseUrl');
    }

    return new DiskStorageProvider(config);
  }

  /**
   * Create S3 storage provider
   */
  private createS3StorageProvider(config: S3StorageConfig): S3StorageProvider {
    if (!config) {
      throw new Error('S3 storage configuration is missing');
    }

    if (!config.region || !config.bucket || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error(
        'S3 storage configuration must include region, bucket, accessKeyId, and secretAccessKey',
      );
    }

    return new S3StorageProvider(config);
  }
}
