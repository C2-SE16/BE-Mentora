import { Module } from '@nestjs/common';
import { LectureController } from '../controllers/lecture.controller';
import { LectureService } from '../services/lecture.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LectureController],
  providers: [LectureService],
  exports: [LectureService],
})
export class LectureModule {} 