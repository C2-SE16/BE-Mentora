import { Module } from '@nestjs/common';
import { FavoriteController } from 'src/common/controllers/favorite.controller';
import { CourseModule } from 'src/common/modules/course.module';
import { FavoriteService } from 'src/common/services/favorite.service';

@Module({
  imports: [CourseModule],
  controllers: [FavoriteController],
  providers: [FavoriteService],
})
export class FavoriteModule {}
