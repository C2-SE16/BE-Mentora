import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from '../services/upload-image.service';
import { UploadImageController } from '../controllers/upload-image.controller';
import { UserModule } from './user.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ConfigModule, UserModule],
  controllers: [UploadImageController],
  providers: [CloudinaryService, PrismaService],
  exports: [CloudinaryService],
})
export class UploadImageModule {}
