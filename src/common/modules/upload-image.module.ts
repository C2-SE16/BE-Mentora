import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from '../services/upload-image.service';
import { UploadImageController } from '../controllers/upload-image.controller';
import { UserModule } from './user.module';

@Module({
  imports: [ConfigModule, UserModule],
  controllers: [UploadImageController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadImageModule {}
