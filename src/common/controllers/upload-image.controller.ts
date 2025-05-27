import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
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
import { PrismaService } from '../prisma/prisma.service';

@Controller('upload-image')
export class UploadImageController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prismaService: PrismaService,
  ) {}

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

  @Post('course/:courseId/thumbnail')
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
  async uploadCourseThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Param('courseId') courseId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Không có file được tải lên');
    }

    try {
      // Kiểm tra xem khóa học có tồn tại không
      const course = await this.prismaService.tbl_courses.findUnique({
        where: { courseId },
      });

      if (!course) {
        throw new BadRequestException('Không tìm thấy khóa học');
      }

      // Lấy thông tin ảnh thumbnail cũ (nếu có)
      const oldThumbnail = course.thumbnail;

      // Upload ảnh mới lên Cloudinary
      const result = await this.cloudinaryService.uploadImage(
        file,
        `mentora/courses/${courseId}/thumbnail`,
      );

      // Cập nhật URL thumbnail mới vào database
      await this.prismaService.tbl_courses.update({
        where: { courseId },
        data: {
          thumbnail: result.secure_url,
          updatedAt: new Date(),
        },
      });

      // Nếu có ảnh cũ và ảnh cũ thuộc Cloudinary, thì xóa ảnh cũ
      if (oldThumbnail && oldThumbnail.includes('cloudinary')) {
        const publicId = this.getPublicIdFromUrl(oldThumbnail);
        if (publicId) {
          await this.cloudinaryService.deleteImage(publicId);
        }
      }

      return {
        success: true,
        message: 'Upload ảnh thumbnail khóa học thành công',
        data: {
          thumbnailUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Lỗi khi tải ảnh thumbnail khóa học: ${error.message}`,
      );
    }
  }

  @Post('course/:courseId/images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 10, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpeg|png|jpg|webp|gif)/)) {
          return cb(
            new BadRequestException(
              'Chỉ chấp nhận file hình ảnh (JPEG, PNG, JPG, WEBP, GIF)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadCourseImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('courseId') courseId: string,
    @Body('imageType') imageType: string = 'content',
  ) {
    if (!file) {
      throw new BadRequestException('Không có file được tải lên');
    }

    try {
      // Kiểm tra xem khóa học có tồn tại không
      const course = await this.prismaService.tbl_courses.findUnique({
        where: { courseId },
      });

      if (!course) {
        throw new BadRequestException('Không tìm thấy khóa học');
      }

      // Upload ảnh lên Cloudinary
      const result = await this.cloudinaryService.uploadImage(
        file,
        `mentora/courses/${courseId}/${imageType}`,
      );

      return {
        success: true,
        message: 'Upload ảnh khóa học thành công',
        data: {
          imageUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Lỗi khi tải ảnh khóa học: ${error.message}`,
      );
    }
  }

  @Delete('course/:courseId/images/:publicId')
  @UseGuards(JwtAuthGuard)
  async deleteCourseImage(@Param('publicId') publicId: string) {
    try {
      const result = await this.cloudinaryService.deleteImage(publicId);
      
      return {
        success: result.result === 'ok',
        message: result.result === 'ok' 
          ? 'Xóa ảnh khóa học thành công' 
          : 'Không thể xóa ảnh',
      };
    } catch (error) {
      throw new BadRequestException(`Lỗi khi xóa ảnh: ${error.message}`);
    }
  }

  /**
   * Trích xuất public_id từ URL Cloudinary
   */
  private getPublicIdFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex((part) => part === 'upload');
      if (uploadIndex === -1) return null;

      const pathParts = urlParts.slice(uploadIndex + 2);
      const fullPath = pathParts.join('/').replace(/\.[^/.]+$/, '');
      return fullPath;
    } catch (e) {
      console.error('Lỗi khi trích xuất public_id:', e);
      return null;
    }
  }
}
