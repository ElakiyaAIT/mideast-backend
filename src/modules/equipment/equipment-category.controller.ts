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
import { EquipmentCategoryService } from './equipment-category.service';
import { CreateEquipmentCategoryDto, UpdateEquipmentCategoryDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { EquipmentCategory } from './schemas/equipment-category.schema';

@Controller('admin/equipment-categories')
@UseGuards(JwtAuthGuard, AdminGuard)
export class EquipmentCategoryController {
  constructor(private readonly categoryService: EquipmentCategoryService) {}

  @Post()
  create(@Body() createDto: CreateEquipmentCategoryDto): Promise<EquipmentCategory> {
    return this.categoryService.create(createDto);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('parentId') parentId?: string,
    @Query('isActive') isActive?: boolean,
  ): Promise<PaginationResultDto<EquipmentCategory>> {
    return this.categoryService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      parentId,
      isActive: isActive !== undefined ? isActive === true : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<EquipmentCategory> {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEquipmentCategoryDto,
  ): Promise<EquipmentCategory> {
    return this.categoryService.update(id, updateDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Body('deletedBy') deletedBy: string,
  ): Promise<EquipmentCategory> {
    return this.categoryService.remove(id, deletedBy);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string): Promise<EquipmentCategory> {
    return this.categoryService.restore(id);
  }
}
