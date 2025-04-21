import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CloudinaryService } from '../services/upload-image.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadBase64ImageDto, UploadImageDto } from '../dto/upload-image.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('upload-image')
export class UploadImageController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpeg|png|gif|webp)/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadImageDto: UploadImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.cloudinaryService.uploadImage(
        file,
        uploadImageDto.folder,
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  @Post('base64')
  @UseGuards(JwtAuthGuard)
  async uploadBase64Image(@Body() uploadBase64ImageDto: UploadBase64ImageDto) {
    if (!uploadBase64ImageDto.base64Image) {
      throw new BadRequestException('No base64 image provided');
    }

    try {
      const result = await this.cloudinaryService.uploadBase64Image(
        uploadBase64ImageDto.base64Image,
        uploadBase64ImageDto.folder,
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload base64 image: ${error.message}`,
      );
    }
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpeg|png|jpg|webp)/)) {
          return cb(
            new BadRequestException(
              'Chỉ chấp nhận file hình ảnh (JPEG, PNG, JPG, WEBP)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatarProfile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const userId = req.user.userId;
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.cloudinaryService.uploadProfileImage(
        file,
        userId,
      );

      return {
        success: true,
        message: 'Upload ảnh hồ sơ thành công',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload avatar profile: ${error.message}`,
      );
    }
  }
}
