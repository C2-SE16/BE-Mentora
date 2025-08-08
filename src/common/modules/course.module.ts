import { Module } from '@nestjs/common';
import { CourseController } from '../controllers/course.controller';
import { CourseService } from '../services/course.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ElasticsearchModule } from './elasticsearch.module';
import { VoucherService } from '../services/voucher.service';
import { CourseDiscoverController } from '../controllers/course-discover.controller';
import { CourseDiscoverService } from '../services/course-discover.service';

@Module({
  imports: [PrismaModule, ElasticsearchModule],
  controllers: [CourseController, CourseDiscoverController],
  providers: [CourseService, VoucherService, CourseDiscoverService],
  exports: [CourseService],
})
export class CourseModule {}
