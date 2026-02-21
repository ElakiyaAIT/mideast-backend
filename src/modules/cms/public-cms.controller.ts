import { Controller, Get, Param } from "@nestjs/common";
import { StaticPageService } from "./static-page.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller('/cms/pages')
export class PubliCmsController{
    constructor(private readonly staticPageService: StaticPageService){}

@Public()
@Get(':slug')
async getBySlug(@Param('slug') slug: string) {
  return this.staticPageService.findOne(slug);
}
}