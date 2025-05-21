import { Module } from '@nestjs/common';
import { UploadController } from 'src/common/controllers/upload.controller';
import { UploadService } from 'src/common/services/upload.service';
import { LectureService } from 'src/common/services/lecture.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, LectureService, PrismaService],
})
export class UploadModule {}
