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
import { LectureProgressGuard } from './guards/lecture-progress.guard';
import { ProgressService } from './services/progress.service';
import { ProgressController } from './controllers/progress.controller';
import { LectureVideoController } from './controllers/lecture-video.controller';
import { VideoService } from './services/video.service';
import { CurriculumProgressController } from './controllers/curriculum-progress.controller';
import { QuizAttemptModule } from './modules/quiz-attempts.module';
// ... import các service và repository khác

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    VoucherModule,
    QuizAttemptModule,
    // ... các module khác
  ],
  controllers: [
    CourseEnrollmentController,
    CourseAccessController,
    ProgressController,
    LectureVideoController,
    CurriculumProgressController,
    // ... các controller khác
  ],
  providers: [
    CartService,
    CourseEnrollmentService,
    CourseEnrollmentRepository,
    CourseAccessService,
    RoleCheckService,
    ProgressService,
    LectureProgressGuard,
    VideoService,
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
    ProgressService,
    LectureProgressGuard,
    VideoService,
    // ... các service và repository khác
  ],
})
export class CommonModule { } 