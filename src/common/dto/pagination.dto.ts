import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginationResultDto<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  constructor(items: T[], totalItems: number, currentPage: number, limit: number) {
    this.items = items;
    this.pagination = {
      total: totalItems,
      page: currentPage,
      limit: limit,
      totalPages: Math.ceil(totalItems / limit),
    };
  }
}
