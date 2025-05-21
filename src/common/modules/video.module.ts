import { Module } from '@nestjs/common';
import { VideoController } from 'src/common/controllers/video.controller';
import { VideoService } from 'src/common/services/video.service';

@Module({
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
