import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { StaticPageService } from './static-page.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Banner } from './schemas/banner.schema';
import { StaticPage } from './schemas/static-page.schema';
import { CreateStaticPageDto } from './dto/create-static-page.dto';
import { UpdateStaticPageDto } from './dto/update-static-page.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtUser } from '@/common/dto/response.dto';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Controller('admin/cms')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CmsController {
  constructor(
    private readonly bannerService: BannerService,
    private readonly staticPageService: StaticPageService,
  ) {}

  // Banners
  @Post('banners')
  createBanner(@Body() createDto: CreateBannerDto): Promise<Banner> {
    return this.bannerService.create(createDto);
  }

  @Get('banners')
  findAllBanners(): Promise<Banner[]> {
    return this.bannerService.findAll();
  }

  @Get('banners/:id')
  findOneBanner(@Param('id') id: string): Promise<Banner> {
    return this.bannerService.findOne(id);
  }

  @Patch('banners/:id')
  updateBanner(@Param('id') id: string, @Body() updateDto: UpdateBannerDto): Promise<Banner> {
    return this.bannerService.update(id, updateDto);
  }

  @Delete('banners/:id')
  removeBanner(@Param('id') id: string): Promise<Banner> {
    return this.bannerService.remove(id);
  }

  // Static Pages
  @Post('pages')
  createPage(@Body() createDto: CreateStaticPageDto): Promise<StaticPage> {
    return this.staticPageService.create(createDto);
  }

  @Get('pages')
  findAllPages(
    @Query() filters: { page?: number; limit?: number; isPublishes?: boolean },
  ): Promise<PaginationResultDto<StaticPage>> {
    return this.staticPageService.findAll(filters);
  }
  @Get('pages/:slug')
  findOnePage(@Param('slug') slug: string): Promise<StaticPage> {
    return this.staticPageService.findOne(slug);
  }

  @Patch('pages/:slug')
  updatePage(
    @Param('slug') slug: string,
    @Body() updateDto: UpdateStaticPageDto,
    @CurrentUser() user: JwtUser,
  ): Promise<StaticPage> {
    return this.staticPageService.update(slug, updateDto, user._id);
  }

  @Delete('pages/:slug')
  removePage(@Param('slug') slug: string): Promise<void> {
    return this.staticPageService.remove(slug);
  }
}
