import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
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

  getImageUrl(publicId: string, options: any = {}) {
    return cloudinary.url(publicId, options);
  }
}
