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
// import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('admin/upload')
@UseGuards(JwtAuthGuard)
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

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'equipment-category');

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

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'auction');

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

    const uploadedFile = await this.uploadService.uploadSingleFile(file, 'testimonial');

    return { url: uploadedFile.url };
  }

  @Post('banner-image')
  @UseInterceptors(FileInterceptor('image'))
  async UploadBannerImage(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const uploadedFile = await this.uploadService.uploadSingleFile(file, 'banner');

    return { url: uploadedFile.url };
  }

  //IMAGE UPLOAD IN SELL FORMS
  //CONDITION
  //Exterior

  @Post('exterior-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
  async uploadExteriorImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'condition/exterior');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //Engine
  @Post('engine-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
  async uploadEngineImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'condition/engine');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //Hydraulics
  @Post('hydraulics-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
  async uploadHydraulicsImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'condition/hydraulics');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //undercarriage
  @Post('underCarriage-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
  async uploadUndercarriageImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'condition/undercarriage');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //FunctionalTest
  @Post('functional-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
  async uploadfunctionalImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'condition/functional');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //Media
  @Post('exteriorMedia-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
  async uploadExteriorMediaImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'media/exterior');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //Engine Compartment
  @Post('engineMedia-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
  async uploadEngineMediaImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'media/engine');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //underCarriage
  @Post('underCarriageMedia-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
  async uploadUndercarriageMediaImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'media/underCarriage');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //cab interior
  @Post('cabInteriorMedia-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
  async uploadCabInteriorMediaImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'media/cabInterior');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //other attachments
  @Post('otherMedia-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 auction images
  async uploadOtherMediaImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'media/Others');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //videos
  @Post('videos')
  @UseInterceptors(
    FilesInterceptor('videos', 10, {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadVideos(@UploadedFiles() files: Express.Multer.File[]): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'media/videos');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //Documents
  //Ownership
  @Post('ownership-docs')
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadOwnershipDocuments(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'ownership');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //Invoice/Bill of sale
  @Post('invoice-docs')
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadInvoiceDocuments(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'invoice');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //Registration
  @Post('registration-docs')
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadRegistrationDocuments(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'registration');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //EmissionTest
  @Post('emissionTest-Docs')
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadEmissionDocuments(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'emissionTest');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //Insurance
  @Post('insurance-docs')
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadInsuranceDocuments(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'insurance');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
  //Insurance
  @Post('maintenance-docs')
  @UseInterceptors(
    FilesInterceptor('documents', 10, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadMaintenanceDocuments(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await this.uploadService.uploadFiles(files, 'maintenance');

    const urls = uploadedFiles.map((file) => file.url);

    return { urls };
  }
}
