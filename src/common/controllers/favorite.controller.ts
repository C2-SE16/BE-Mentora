import { Controller, Post, Delete, Get, Body, Param } from '@nestjs/common';
import { FavoriteService } from 'src/common/services/favorite.service';

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  async addToFavorites(@Body() body: { userId: string; courseId: string }) {
    console.log(body.userId, body.courseId);
    await this.favoriteService.addCourseToFavorites(body.userId, body.courseId);
    return { message: 'Đã thêm vào danh sách yêu thích' };
  }

  @Delete()
  async removeFromFavorites(
    @Body() body: { userId: string; courseId: string },
  ) {
    await this.favoriteService.removeCourseFromFavorites(
      body.userId,
      body.courseId,
    );
    return { message: 'Đã xoá khỏi danh sách yêu thích' };
  }

  @Get(':userId')
  async getFavorites(@Param('userId') userId: string) {
    console.log('controller' + userId);
    const courses = await this.favoriteService.getFavoriteCourses(userId);
    return { userId, favoriteCourses: courses };
  }

  @Delete('clear/:userId')
  async clearFavorites(@Param('userId') userId: string) {
    await this.favoriteService.clearFavorites(userId);
    return { message: 'Đã xoá toàn bộ danh sách yêu thích của người dùng' };
  }
}
