import { Module } from '@nestjs/common';
import { LessonController } from '../controllers/lesson.controller';
import { LessonService } from '../services/lesson.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LessonController],
  providers: [LessonService],
  exports: [LessonService],
})
export class LessonModule {} 