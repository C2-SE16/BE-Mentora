import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './cache/redis.module';
import { CartService } from './services/cart.service';
import { CourseEnrollmentService } from './services/course-enrollment.service';
import { CourseEnrollmentRepository } from './repositories/course-enrollment.repository';
import { CourseEnrollmentController } from './controllers/course-enrollment.controller';
import { CourseAccessService } from './services/course-access.service';
import { CourseAccessController } from './controllers/course-access.controller';
import { RoleCheckService } from './services/role-check.service';
import { VoucherModule } from './modules/voucher.module';
// ... import các service và repository khác

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    VoucherModule,
    // ... các module khác
  ],
  controllers: [
    CourseEnrollmentController,
    CourseAccessController,
    // ... các controller khác
  ],
  providers: [
    CartService,
    CourseEnrollmentService,
    CourseEnrollmentRepository,
    CourseAccessService,
    RoleCheckService,
    // ... các service và repository khác
  ],
  exports: [
    PrismaModule,
    RedisModule,
    CartService,
    CourseEnrollmentService,
    CourseEnrollmentRepository,
    CourseAccessService,
    RoleCheckService,
    // ... các service và repository khác
  ],
})
export class CommonModule {} 