import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSettings } from '../../modules/settings/schemas/system-settings.schema';

@Injectable()
export class SystemSettingsSeeder {
  constructor(
    @InjectModel(SystemSettings.name)
    private settingsModel: Model<SystemSettings>,
  ) {}

  async seed(): Promise<void> {
    console.log('Seeding system settings...');

    const settings = [
      {
        key: 'commission.fixed_fee',
        value: '100',
        dataType: 'number',
        category: 'commission',
        description: 'Fixed commission fee in USD',
      },
      {
        key: 'commission.percentage',
        value: '3',
        dataType: 'number',
        category: 'commission',
        description: 'Commission percentage',
      },
      {
        key: 'auction.default_duration_days',
        value: '7',
        dataType: 'number',
        category: 'auction',
        description: 'Default auction duration in days',
      },
      {
        key: 'platform.name',
        value: 'Mid-East Equipment',
        dataType: 'string',
        category: 'general',
        description: 'Platform name',
      },
      {
        key: 'platform.maintenance_mode',
        value: 'false',
        dataType: 'boolean',
        category: 'general',
        description: 'Maintenance mode flag',
      },
    ];

    for (const settingData of settings) {
      const exists = await this.settingsModel.findOne({ key: settingData.key });

      if (!exists) {
        const setting = new this.settingsModel(settingData);
        await setting.save();
        console.log(`✓ Created setting: ${settingData.key}`);
      } else {
        console.log(`- Setting already exists: ${settingData.key}`);
      }
    }

    console.log('System settings seeding completed!');
  }
}
