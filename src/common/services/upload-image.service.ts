import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { UserService } from './user.service';

@Injectable()
export class CloudinaryService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'mentora',
  ): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          },
        );

        const readableStream = new Readable();
        readableStream.push(file.buffer);
        readableStream.push(null);
        readableStream.pipe(upload);
      });
    } catch (error) {
      throw new Error(`Error uploading image to cloudinary ${error.message}`);
    }
  }

  async uploadBase64Image(
    base64: string,
    folder: string = 'mentora',
  ): Promise<any> {
    try {
      return await cloudinary.uploader.upload(base64, {
        folder,
        resource_type: 'image',
      });
    } catch (error) {
      throw new Error(
        `Error uploading base64 image to cloudinary ${error.message}`,
      );
    }
  }

  async deleteImage(publicId: string): Promise<any> {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Error deleting image from cloudinary ${error.message}`);
    }
  }

  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<any> {
    try {
      const currentUser = await this.userService.getUserById(userId);
      const oldAvatarUrl = currentUser?.avatar;

      if (!file) {
        throw new Error('No file uploaded');
      }
      const result = await this.uploadImage(file, `mentora/profile/${userId}`);

      if (result) {
        await this.userService.updateUserProfile(userId, {
          avatar: result.secure_url,
        });

        if (
          oldAvatarUrl &&
          !oldAvatarUrl.includes('default-avatar') &&
          oldAvatarUrl.includes('cloudinary')
        ) {
          const publicId = this.getPublicIdFromUrl(oldAvatarUrl);
          if (publicId) {
            await this.deleteImage(publicId);
          }
        }
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new Error(`Error uploading profile image: ${error.message}`);
    }
  }

  private getPublicIdFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex((part) => part === 'upload');
      if (uploadIndex === -1) return null;

      const pathParts = urlParts.slice(uploadIndex + 2);
      const fullPath = pathParts.join('/').replace(/\.[^/.]+$/, '');
      return fullPath;
    } catch (e) {
      console.error('Error extracting public_id:', e);
      return null;
    }
  }

  getImageUrl(publicId: string, options: any = {}) {
    return cloudinary.url(publicId, options);
  }
}
