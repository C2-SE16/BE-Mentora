import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CourseModule } from './common/modules/course.module';
import { CategoryModule } from './common/modules/category.module';
import { UploadModule } from 'src/common/modules/upload.module';
import { AuthModule } from './auth/auth.module';
import { VideoModule } from 'src/common/modules/video.module';
import { ReviewModule } from 'src/common/modules/review.module';
import { ElasticsearchModule } from './common/modules/elasticsearch.module';
import { ElasticsearchController } from './common/controllers/elasticsearch.controller';
import { ModuleModule } from './common/modules/module.module';
import { CurriculumModule } from './common/modules/curriculum.module';
import { LectureModule } from './common/modules/lecture.module';
import { RedisModule } from './common/cache/redis.module';
import { RedisExampleController } from './common/controllers/redis-example.controller';
import { UploadImageModule } from './common/modules/upload-image.module';
import { FavoriteModule } from 'src/common/modules/favorite.module';
import { CartModule } from './common/modules/cart.module';
import { UserModule } from './common/modules/user.module';
import { InstructorModule } from './common/modules/instructor.module';
import { QuizAttemptModule } from 'src/common/modules/quiz-attempts.module';
import { QuizzModule } from 'src/common/modules/quizz.module';
import { QuestionModule } from 'src/common/modules/question.module';
import { RolesGuard } from './auth/guards/roles.guard';
import { VoucherModule } from './common/modules/voucher.module';
import { DiscussingModule } from 'src/common/modules/discussing.module';
import { ProgressModule } from 'src/common/modules/progress.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CourseModule,
    CategoryModule,
    UploadModule,
    AuthModule,
    VideoModule,
    ReviewModule,
    ElasticsearchModule,
    ModuleModule,
    CurriculumModule,
    LectureModule,
    CurriculumModule,
    LectureModule,
    RedisModule,
    UploadImageModule,
    RedisModule,
    QuizAttemptModule,
    QuizzModule,
    QuestionModule,
    FavoriteModule,
    CartModule,
    UserModule,
    InstructorModule,
    VoucherModule,
    DiscussingModule,
    ProgressModule,
    PaymentModule,
  ],
  controllers: [ElasticsearchController, RedisExampleController],
  providers: [
    // Đã xóa ClassSerializerInterceptor để tránh xung đột
    // { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
