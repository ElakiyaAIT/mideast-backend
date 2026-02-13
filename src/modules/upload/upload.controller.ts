import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('admin/upload')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('equipment-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  async uploadEquipmentImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'equipment');
    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }

  //IMAGE UPLOAD IN EQUIPMENT_CATEGORY
  @Post('equipment-category-images')
  @UseInterceptors(FilesInterceptor('images', 5)) // Max 5 category images
  async uploadEquipmentCategoryImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(
      files,
      'equipment-category',
    );

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }

  //IMAGE UPLOAD IN AUCTION
  @Post('auction-images')
@UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
async uploadAuctionImages(
  @UploadedFiles() files: Express.Multer.File[],
): Promise<{ urls: string[] }> {
  if (!files || files.length === 0) {
    throw new BadRequestException('No files uploaded');
  }

  const uploadedFiles = await this.uploadService.uploadFiles(
    files,
    'auction',
  );

  const urls = uploadedFiles.map((file) => file.url);

  return { urls };
}

//TESTIMONIAL IMAGE UPLOAD
@Post('testimonial-image')
@UseInterceptors(FileInterceptor('image'))
async uploadTestimonialImage(
  @UploadedFile() file: Express.Multer.File,
): Promise<{ url: string }> {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }

  const uploadedFile = await this.uploadService.uploadSingleFile(
    file,
    'testimonial',
  );

  return { url: uploadedFile.url };
}

}
