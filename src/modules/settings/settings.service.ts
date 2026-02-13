import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SystemSettings } from './schemas/system-settings.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(SystemSettings.name)
    private settingsModel: Model<SystemSettings>,
  ) {}

  async findAll(category?: string): Promise<SystemSettings[]> {
    const query = category ? { category } : {};
    return this.settingsModel.find(query).exec();
  }

  async findOne(key: string): Promise<SystemSettings> {
    const setting = await this.settingsModel.findOne({ key }).exec();

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return setting;
  }

  async update(key: string, value: string, updatedBy: string): Promise<SystemSettings> {
    const setting = await this.findOne(key);
    setting.value = value;
    setting.updatedBy = new Types.ObjectId(updatedBy);
    return setting.save();
  }

  async create(data: {
    key: string;
    value: string;
    description?: string;
    dataType?: string;
    category?: string;
  }): Promise<SystemSettings> {
    const setting = new this.settingsModel(data);
    return setting.save();
  }
}
