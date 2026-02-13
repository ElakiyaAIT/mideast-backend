import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner } from './schemas/banner.schema';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name)
    private bannerModel: Model<Banner>,
  ) {}

  async create(createDto: CreateBannerDto): Promise<Banner> {
    const banner = new this.bannerModel(createDto);
    return banner.save();
  }

  async findAll(): Promise<Banner[]> {
    return this.bannerModel.find({ isDeleted: false }).sort({ sortOrder: 1, createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Banner> {
    const banner = await this.bannerModel.findOne({ _id: id, isDeleted: false }).exec();

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return banner;
  }

  async update(id: string, updateDto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.findOne(id);
    Object.assign(banner, updateDto);
    return banner.save();
  }

  async remove(id: string): Promise<Banner> {
    const banner = await this.findOne(id);
    banner.isDeleted = true;
    return banner.save();
  }
}
