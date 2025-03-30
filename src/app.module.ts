import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CourseModule } from './common/modules/course.module';
import { CategoryModule } from './common/modules/category.module';
import { UploadModule } from 'src/common/modules/upload.module';
import { AuthModule } from './auth/auth.module';
import { VideoModule } from 'src/common/modules/video.module';
import { ElasticsearchModule } from './common/modules/elasticsearch.module';
import { ElasticsearchController } from './common/controllers/elasticsearch.controller';

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
    ElasticsearchModule
  ],
  controllers: [
    ElasticsearchController
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
