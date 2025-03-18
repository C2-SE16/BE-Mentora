import { Module } from '@nestjs/common';
import { UploadController } from 'src/common/controllers/upload.controller';
import { UploadService } from 'src/common/services/upload.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
