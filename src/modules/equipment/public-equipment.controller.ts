import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto, FilterEquipmentDto } from './dto';
import { Equipment } from './schemas/equipment.schema';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { Public } from '@/common/decorators/public.decorator';
import { EquipmentStatus } from './enums';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('equipment')
@Public()
export class PublicEquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  async findAll(@Query() filters: FilterEquipmentDto): Promise<PaginationResultDto<Equipment>> {
    // Only return published and approved equipment for public view
    const publicFilters = {
      ...filters,
      status: EquipmentStatus.APPROVED,
      isPublished: true,
      isDeleted: false,
    };
    return this.equipmentService.findAll(publicFilters);
  }
  @Get('latest')
  async getLatest(): Promise<Equipment[]> {
    return this.equipmentService.getLatest();
  }
  @Get('featured')
  async getFeatured(@Query('limit') limit: number = 3): Promise<Equipment[]> {
    const result = await this.equipmentService.findAll({
      page: 1,
      limit,
      status: EquipmentStatus.APPROVED,
      isPublished: true,
      isDeleted: false,
      isFeatured: true,
    });
    return result.items;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Equipment> {
    const equipment = await this.equipmentService.findOne(id);
    // Only return if published and approved
    if (
      !equipment.isPublished ||
      equipment.status !== EquipmentStatus.APPROVED ||
      equipment.isDeleted
    ) {
      throw new Error('Equipment not found');
    }

    // Increment view count
    await this.equipmentService.incrementViewCount(id);

    return equipment;
  }
  @Get(':id/related')
  async getRelated(
    @Param('id') id: string,
    @Query('page') page: string = '1', // page number from query string
    @Query('limit') limit: string = '3', // optional, default 3
  ): Promise<PaginationResultDto<Equipment>> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return this.equipmentService.getRelatedByCategory(id, pageNumber, limitNumber);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDto: CreateEquipmentDto): Promise<Equipment> {
    return this.equipmentService.create(createDto);
  }
}
