import { Module } from '@nestjs/common';
import { CourseController } from '../controllers/course.controller';
import { CourseService } from '../services/course.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ElasticsearchModule } from './elasticsearch.module';
import { VoucherService } from '../services/voucher.service';

@Module({
  imports: [PrismaModule, ElasticsearchModule],
  controllers: [CourseController],
  providers: [CourseService, VoucherService],
  exports: [CourseService],
})
export class CourseModule {}
