import { Controller, Get, Query } from '@nestjs/common';
import { EquipmentCategoryService } from './equipment-category.service';
import { EquipmentCategory } from './schemas/equipment-category.schema';
import { Public } from '@/common/decorators/public.decorator';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Controller('equipment-categories')
export class PublicEquipmentCategoryController {
  constructor(
    private readonly categoryService: EquipmentCategoryService,
  ) {}

  /**
   * Get all equipment categories (PUBLIC)
   */
  @Public()
  @Get()
  getAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('parentId') parentId?: string,
    @Query('isActive') isActive?: string,
  ): Promise<PaginationResultDto<EquipmentCategory>> {
    return this.categoryService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      parentId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }
}
