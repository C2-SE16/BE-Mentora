import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from '../services/upload-image.service';
import { UploadImageController } from '../controllers/upload-image.controller';

@Module({
  imports: [ConfigModule],
  controllers: [UploadImageController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadImageModule {}
