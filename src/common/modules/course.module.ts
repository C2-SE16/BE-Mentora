import { Module } from '@nestjs/common';
import { CourseController } from '../controllers/course.controller';
import { CourseService } from '../services/course.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ElasticsearchModule } from './elasticsearch.module';

@Module({
  imports: [PrismaModule, ElasticsearchModule],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
