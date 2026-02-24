import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { ConfigModule } from '../../common/config/config.module';
import { StorageProviderFactory } from './storage/storage-provider.factory';
import { STORAGE_PROVIDER_TOKEN } from './storage/storage-provider.token';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [
    StorageProviderFactory,
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: async (
        factory: StorageProviderFactory,
      ): Promise<ReturnType<StorageProviderFactory['createStorageProvider']>> => {
        return await factory.createStorageProvider();
      },
      inject: [StorageProviderFactory],
    },
    UploadService,
  ],
  exports: [UploadService],
})
export class UploadModule {}
