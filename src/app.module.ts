import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CourseModule } from './common/modules/course.module';
import { CategoryModule } from './common/modules/category.module';
import { UploadModule } from 'src/common/modules/upload.module';
import { AuthModule } from './auth/auth.module';
import { VideoModule } from 'src/common/modules/video.module';
import { ReviewModule } from 'src/common/modules/review.module';

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
  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
