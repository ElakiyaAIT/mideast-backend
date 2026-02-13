import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SystemSettings, SystemSettingsSchema } from './schemas/system-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SystemSettings.name, schema: SystemSettingsSchema }]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
