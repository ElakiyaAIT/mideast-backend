import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  ApproveEquipmentDto,
  RejectEquipmentDto,
  FilterEquipmentDto,
  BulkApproveDto,
} from './dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import type { JwtUser } from '@/common/dto/response.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Equipment } from './schemas/equipment.schema';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { AdminJwtAuthGuard } from '@/common/guards/admin-jwt.guard';
import { AdminRoute } from '@/common/decorators/admin-route.decorator';

@Controller('admin/equipment')
@AdminRoute()
@UseGuards(AdminJwtAuthGuard, AdminGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  create(@Body() createDto: CreateEquipmentDto): Promise<Equipment> {
    return this.equipmentService.create(createDto);
  }

  @Get()
  findAll(@Query() filters: FilterEquipmentDto): Promise<PaginationResultDto<Equipment>> {
    return this.equipmentService.findAll(filters);
  }

  @Get('pending-approvals')
  getPendingApprovals(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginationResultDto<Equipment>> {
    return this.equipmentService.getPendingApprovals(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Equipment> {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEquipmentDto,
    @CurrentUser() user: JwtUser,
  ): Promise<Equipment> {
    return this.equipmentService.update(id, updateDto, user._id);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveEquipmentDto,
    @CurrentUser() user: JwtUser,
  ): Promise<Equipment> {
    return this.equipmentService.approve(id, approveDto, user._id);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectEquipmentDto,
    @CurrentUser() user: JwtUser,
  ): Promise<Equipment> {
    return this.equipmentService.reject(id, rejectDto, user._id);
  }

  @Post('bulk-approve')
  bulkApprove(
    @Body() bulkApproveDto: BulkApproveDto,
    @CurrentUser() user: JwtUser,
  ): Promise<{ approved: number; failed: number }> {
    return this.equipmentService.bulkApprove(bulkApproveDto, user._id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser): Promise<Equipment> {
    return this.equipmentService.remove(id, user._id);
  }

  @Post(':id/increment-view')
  incrementView(@Param('id') id: string): Promise<void> {
    return this.equipmentService.incrementViewCount(id);
  }

  @Post(':id/increment-inquiry')
  incrementInquiry(@Param('id') id: string): Promise<void> {
    return this.equipmentService.incrementInquiryCount(id);
  }
}
