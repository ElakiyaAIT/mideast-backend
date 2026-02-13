import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannerService } from './banner.service';
import { StaticPageService } from './static-page.service';
import { CmsController } from './cms.controller';
import { Banner, BannerSchema } from './schemas/banner.schema';
import { StaticPage, StaticPageSchema } from './schemas/static-page.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Banner.name, schema: BannerSchema },
      { name: StaticPage.name, schema: StaticPageSchema },
    ]),
  ],
  controllers: [CmsController],
  providers: [BannerService, StaticPageService],
  exports: [BannerService, StaticPageService],
})
export class CmsModule {}
