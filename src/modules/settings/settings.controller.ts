import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtUser } from '@/common/dto/response.dto';
import { SystemSettings } from './schemas/system-settings.schema';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll(@Query('category') category?: string): Promise<SystemSettings[]> {
    return this.settingsService.findAll(category);
  }

  @Get(':key')
  findOne(@Param('key') key: string): Promise<SystemSettings> {
    return this.settingsService.findOne(key);
  }

  @Patch(':key')
  update(
    @Param('key') key: string,
    @Body('value') value: string,
    @CurrentUser() user: JwtUser,
  ): Promise<SystemSettings> {
    return this.settingsService.update(key, value, user._id);
  }
}
